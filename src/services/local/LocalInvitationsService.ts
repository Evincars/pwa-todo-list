import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { AppError } from '@/domain/errors';
import { assertCanManage, getListAccess } from '@/domain/permissions';
import type {
  CreateInvitationInput,
  Invitation,
  InvitationId,
  ListId,
  ListMember,
  TodoList,
  UserProfile,
} from '@/domain/types';
import { toUserSummary } from '@/domain/types';
import type { DocumentStore } from '../storage/DocumentStore';
import { where } from '../storage/DocumentStore';
import type { AuthService, InvitationsService } from '../types';
import { paths } from './collections';
import { nowISO, requireUser } from './session';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITATION_TTL_DAYS = 14;

/**
 * NOTE (Firebase): accepting an invitation adds the invitee to `list.members`, which they
 * are not allowed to write yet. In production this should be a callable Cloud Function
 * (or a rule validating `existsAfter(/invitations/$(id))`).
 */
export class LocalInvitationsService implements InvitationsService {
  constructor(
    private readonly store: DocumentStore,
    private readonly auth: AuthService,
  ) {}

  async createInvitation(listId: ListId, input: CreateInvitationInput): Promise<Invitation> {
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
      const pending = await this.store.query<Invitation>(paths.invitations, [
        where('listId', '==', listId),
        where('email', '==', email),
        where('status', '==', 'pending'),
      ]);
      if (pending.length) throw new AppError('failed-precondition', 'alreadyInvited');
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
    await this.store.set(paths.invitation(invitation.id), invitation);
    return invitation;
  }

  async getInvitation(invitationId: InvitationId): Promise<Invitation> {
    requireUser(this.auth);
    return this.fetchInvitation(invitationId);
  }

  async getListInvitations(listId: ListId): Promise<Invitation[]> {
    const user = requireUser(this.auth);
    const list = await this.fetchList(listId);
    assertCanManage(list, user.id);
    const invitations = await this.store.query<Invitation>(paths.invitations, [
      where('listId', '==', listId),
      where('status', '==', 'pending'),
    ]);
    return invitations.filter(isActive).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getMyInvitations(): Promise<Invitation[]> {
    const user = requireUser(this.auth);
    const invitations = await this.store.query<Invitation>(paths.invitations, [
      where('email', '==', user.email),
      where('status', '==', 'pending'),
    ]);
    return invitations.filter(isActive).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async acceptInvitation(invitationId: InvitationId): Promise<TodoList> {
    const user = requireUser(this.auth);
    const invitation = await this.fetchInvitation(invitationId);
    this.assertUsable(invitation, user);
    const list = await this.fetchList(invitation.listId);

    // Already a member (e.g. opened the link twice) – nothing to do.
    if (getListAccess(list, user.id) !== 'none') return list;

    const member: ListMember = {
      userId: user.id,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      permission: invitation.permission,
      joinedAt: nowISO(),
      invitedBy: invitation.invitedBy.id,
    };
    const updatedList: TodoList = {
      ...list,
      members: { ...list.members, [user.id]: member },
      memberIds: [...list.memberIds, user.id],
      updatedAt: nowISO(),
    };
    const updatedInvitation: Invitation = {
      ...invitation,
      // E-mail invitations are single use, links stay valid until revoked/expired.
      status: invitation.kind === 'email' ? 'accepted' : 'pending',
      acceptedBy: [...invitation.acceptedBy, user.id],
    };
    await this.store.batch([
      { type: 'set', path: paths.list(list.id), data: updatedList },
      { type: 'set', path: paths.invitation(invitation.id), data: updatedInvitation },
    ]);
    return updatedList;
  }

  async declineInvitation(invitationId: InvitationId): Promise<void> {
    const user = requireUser(this.auth);
    const invitation = await this.fetchInvitation(invitationId);
    if (invitation.kind !== 'email' || invitation.email !== user.email) {
      throw new AppError('permission-denied', 'invitationNotForYou');
    }
    await this.store.update<Invitation>(paths.invitation(invitationId), { status: 'declined' });
  }

  async revokeInvitation(invitationId: InvitationId): Promise<void> {
    const user = requireUser(this.auth);
    const invitation = await this.fetchInvitation(invitationId);
    assertCanManage(await this.fetchList(invitation.listId), user.id);
    await this.store.update<Invitation>(paths.invitation(invitationId), { status: 'revoked' });
  }

  watchInvitations(onChange: () => void) {
    return this.store.subscribe(`${paths.invitations}/`, onChange);
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
    const invitation = await this.store.get<Invitation>(paths.invitation(invitationId));
    if (!invitation) throw new AppError('not-found', 'invitationNotFound');
    return invitation;
  }

  private async fetchList(listId: ListId) {
    const list = await this.store.get<TodoList>(paths.list(listId));
    if (!list) throw new AppError('not-found', 'listNotFound');
    return list;
  }
}

const isActive = (invitation: Invitation) => dayjs(invitation.expiresAt).isAfter(dayjs());
