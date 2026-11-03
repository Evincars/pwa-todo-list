import dayjs from 'dayjs';
import { arrayUnion, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch, type Firestore } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { AppError, isAppError } from '@/domain/errors';
import { assertCanManage, getListAccess } from '@/domain/permissions';
import type { CreateInvitationInput, Invitation, InvitationId, ListId, ListMember, TodoList, UserProfile } from '@/domain/types';
import { toUserSummary } from '@/domain/types';
import { requireUser } from '../session';
import type { AuthService, InvitationsService, Unsubscribe } from '../types';
import { guard, nowISO, typedCollection, typedDoc, watch } from './helpers';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITATION_TTL_DAYS = 14;

const isActive = (invitation: Invitation) => dayjs(invitation.expiresAt).isAfter(dayjs());
const newestFirst = (a: Invitation, b: Invitation) => b.createdAt.localeCompare(a.createdAt);

/**
 * Accepting works without a Cloud Function: the invitee adds themselves to the list in a batch,
 * and `firestore.rules` only allows that when the referenced invitation is valid for them.
 */
export class FirestoreInvitationsService implements InvitationsService {
  constructor(
    private readonly db: Firestore,
    private readonly auth: AuthService,
  ) {}

  private invitations = () => typedCollection<Invitation>(this.db, 'invitations');
  private invitationRef = (id: InvitationId) => typedDoc<Invitation>(this.db, 'invitations', id);
  private listRef = (listId: ListId) => typedDoc<TodoList>(this.db, 'lists', listId);

  createInvitation = (listId: ListId, input: CreateInvitationInput) =>
    guard(async () => {
      const user = requireUser(this.auth);
      const list = await this.fetchList(listId);
      assertCanManage(list, user.id);

      const email = input.kind === 'email' ? (input.email ?? '').trim().toLowerCase() : null;
      if (input.kind === 'email') {
        if (!email || !EMAIL_PATTERN.test(email)) throw new AppError('invalid-argument', 'invalidEmail');
        if (email === user.email) throw new AppError('invalid-argument', 'alreadyOwner');
        if (Object.values(list.members).some((member) => member.email === email)) {
          throw new AppError('failed-precondition', 'alreadyMember');
        }
        const pending = await getDocs(
          query(this.invitations(), where('listId', '==', listId), where('invitedBy.id', '==', user.id), where('email', '==', email), where('status', '==', 'pending')),
        );
        if (!pending.empty) throw new AppError('failed-precondition', 'alreadyInvited');
      }

      const now = dayjs();
      const invitation: Invitation = {
        id: nanoid(16) as InvitationId,
        kind: input.kind,
        listId,
        listTitle: list.title,
        listIcon: list.icon,
        listColor: list.color,
        email,
        // Invited members can only read unless the host decides otherwise.
        permission: input.permission ?? 'read',
        invitedBy: toUserSummary(user),
        status: 'pending',
        createdAt: now.toISOString(),
        expiresAt: now.add(INVITATION_TTL_DAYS, 'day').toISOString(),
        acceptedBy: [],
      };
      await setDoc(this.invitationRef(invitation.id), invitation);
      return invitation;
    });

  getInvitation = (invitationId: InvitationId) =>
    guard(async () => {
      requireUser(this.auth);
      return this.fetchInvitation(invitationId);
    });

  getListInvitations = (listId: ListId) =>
    guard(async () => {
      const user = requireUser(this.auth);
      const snapshot = await getDocs(this.ownedQuery(user.id, listId));
      return snapshot.docs.map((d) => d.data()).filter(isActive).sort(newestFirst);
    });

  getMyInvitations = () =>
    guard(async () => {
      const user = requireUser(this.auth);
      const snapshot = await getDocs(this.addressedQuery(user.email));
      return snapshot.docs.map((d) => d.data()).filter(isActive).sort(newestFirst);
    });

  acceptInvitation = (invitationId: InvitationId) =>
    guard(async () => {
      const user = requireUser(this.auth);
      const invitation = await this.fetchInvitation(invitationId);

      // Already a member (e.g. opened the link twice) – nothing to do. Non-members can't read the list yet.
      const existing = await this.fetchList(invitation.listId).catch((error: unknown) => {
        if (isAppError(error) && error.code === 'permission-denied') return null;
        throw error;
      });
      if (existing && getListAccess(existing, user.id) !== 'none') return existing;

      this.assertUsable(invitation, user);
      const member: ListMember = {
        userId: user.id,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        permission: invitation.permission,
        joinedAt: nowISO(),
        invitedBy: invitation.invitedBy.id,
        invitationId: invitation.id,
      };
      const batch = writeBatch(this.db);
      batch.update(this.listRef(invitation.listId), {
        [`members.${user.id}`]: member,
        memberIds: arrayUnion(user.id),
        updatedAt: nowISO(),
      });
      // E-mail invitations are single use, links stay valid until revoked/expired.
      batch.update(
        this.invitationRef(invitation.id),
        invitation.kind === 'email' ? { status: 'accepted', acceptedBy: arrayUnion(user.id) } : { acceptedBy: arrayUnion(user.id) },
      );
      await batch.commit();
      return this.fetchList(invitation.listId);
    });

  declineInvitation = (invitationId: InvitationId) =>
    guard(async () => {
      const user = requireUser(this.auth);
      const invitation = await this.fetchInvitation(invitationId);
      if (invitation.kind !== 'email' || invitation.email !== user.email) {
        throw new AppError('permission-denied', 'invitationNotForYou');
      }
      await updateDoc(this.invitationRef(invitationId), { status: 'declined' });
    });

  revokeInvitation = (invitationId: InvitationId) =>
    guard(async () => {
      requireUser(this.auth);
      await updateDoc(this.invitationRef(invitationId), { status: 'revoked' });
    });

  watchInvitations(onChange: () => void): Unsubscribe {
    const user = this.auth.getCurrentUser();
    if (!user) return () => {};
    const stops = [watch(this.addressedQuery(user.email), onChange), watch(this.ownedQuery(user.id), onChange)];
    return () => stops.forEach((stop) => stop());
  }

  /** Pending invitations addressed to an e-mail. */
  private addressedQuery(email: string) {
    return query(this.invitations(), where('email', '==', email), where('status', '==', 'pending'));
  }

  /** Pending invitations created by the owner (optionally of one list) – provable by the rules. */
  private ownedQuery(userId: UserProfile['id'], listId?: ListId) {
    const filters = [where('invitedBy.id', '==', userId), where('status', '==', 'pending')];
    if (listId) filters.push(where('listId', '==', listId));
    return query(this.invitations(), ...filters);
  }

  private assertUsable(invitation: Invitation, user: UserProfile) {
    if (invitation.status !== 'pending') {
      throw new AppError('failed-precondition', 'invitationStatus', { status: invitation.status });
    }
    if (!isActive(invitation)) throw new AppError('failed-precondition', 'invitationExpired');
    if (invitation.kind === 'email' && invitation.email !== user.email) {
      throw new AppError('permission-denied', 'invitationForOther', { email: invitation.email ?? '' });
    }
  }

  private async fetchInvitation(invitationId: InvitationId) {
    const invitation = (await getDoc(this.invitationRef(invitationId))).data();
    if (!invitation) throw new AppError('not-found', 'invitationNotFound');
    return invitation;
  }

  private async fetchList(listId: ListId) {
    const list = await guard(async () => (await getDoc(this.listRef(listId))).data());
    if (!list) throw new AppError('not-found', 'listNotFound');
    return list;
  }
}
