/**
 * Firestore services + security rules against the local emulators (`npm run test:firebase`).
 * Uses the `demo-` project namespace, so nothing ever reaches the real Firebase project.
 */
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  initializeFirestore,
  memoryLocalCache,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AppError } from '@/domain/errors';
import type { UserId, UserProfile } from '@/domain/types';
import { FirestoreInvitationsService } from '@/services/firebase/FirestoreInvitationsService';
import { FirestoreListsService } from '@/services/firebase/FirestoreListsService';
import { FirestoreRemindersService } from '@/services/firebase/FirestoreRemindersService';
import { FirestoreTodosService } from '@/services/firebase/FirestoreTodosService';
import type { AuthService } from '@/services/types';

const PROJECT_ID = 'demo-pwa-todo';
const HOST = '127.0.0.1';
const apps: FirebaseApp[] = [];

interface Session {
  user: UserProfile;
  db: Firestore;
  lists: FirestoreListsService;
  todos: FirestoreTodosService;
  invitations: FirestoreInvitationsService;
  reminders: FirestoreRemindersService;
}

/** Signs a person in through the Auth emulator (it accepts unsigned Google credentials). */
const signIn = async (displayName: string, email: string): Promise<Session> => {
  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-key', authDomain: HOST }, `${email}-${apps.length}`);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${HOST}:9099`, { disableWarnings: true });
  const credential = GoogleAuthProvider.credential(JSON.stringify({ sub: `google-${email}`, email, email_verified: true, name: displayName }));
  const { user: firebaseUser } = await signInWithCredential(auth, credential);

  const db = initializeFirestore(app, { localCache: memoryLocalCache(), ignoreUndefinedProperties: true });
  connectFirestoreEmulator(db, HOST, 8080);

  const now = new Date().toISOString();
  const user: UserProfile = {
    id: firebaseUser.uid as UserId,
    email,
    displayName,
    photoURL: null,
    provider: 'google',
    createdAt: now,
    lastLoginAt: now,
  };
  const authService: AuthService = {
    providers: ['google'],
    initialize: async () => user,
    getCurrentUser: () => user,
    signIn: async () => ({ user, isNewUser: false }),
    signOut: async () => {},
    onAuthStateChanged: () => () => {},
  };
  return {
    user,
    db,
    lists: new FirestoreListsService(db, authService),
    todos: new FirestoreTodosService(db, authService),
    invitations: new FirestoreInvitationsService(db, authService),
    reminders: new FirestoreRemindersService(db, authService),
  };
};

const expectCode = async (promise: Promise<unknown>, code: AppError['code']) => {
  await expect(promise).rejects.toMatchObject({ code });
};

/** Raw SDK errors (direct writes bypassing the services). */
const expectDenied = async (promise: Promise<unknown>) => {
  await expect(promise).rejects.toMatchObject({ code: 'permission-denied' });
};

beforeEach(async () => {
  await fetch(`http://${HOST}:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: 'DELETE' });
});

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => deleteApp(app)));
});

describe('Firestore services + security rules', () => {
  it('shares a list read-only by default and lets the host grant write', async () => {
    const host = await signIn('Host', 'host@example.com');
    const guest = await signIn('Guest', 'guest@example.com');

    const list = await host.lists.createList({ title: 'Groceries', icon: '🛒', color: 'teal' });
    await host.todos.createTodo(list.id, { title: 'Milk', priority: 'high' });
    const invitation = await host.invitations.createInvitation(list.id, { kind: 'email', email: guest.user.email });
    expect(invitation.permission).toBe('read');
    await expectCode(host.invitations.createInvitation(list.id, { kind: 'email', email: guest.user.email }), 'failed-precondition');

    // Before joining the guest sees the invitation, but not the list.
    expect(await guest.invitations.getMyInvitations()).toHaveLength(1);
    await expectCode(guest.lists.getList(list.id), 'permission-denied');
    await expectCode(guest.todos.getTodos(list.id), 'permission-denied');

    await guest.invitations.acceptInvitation(invitation.id);
    expect((await guest.lists.getMyLists()).map((l) => l.id)).toEqual([list.id]);
    expect((await guest.todos.getTodos(list.id)).map((t) => t.title)).toEqual(['Milk']);
    expect(await guest.invitations.getMyInvitations()).toHaveLength(0);

    // Read-only: no task writes, no list edits – neither through the services nor directly.
    await expectCode(guest.todos.createTodo(list.id, { title: 'Eggs' }), 'permission-denied');
    await expectDenied(updateDoc(doc(guest.db, 'lists', list.id), { title: 'Mine now' }));
    await expectDenied(updateDoc(doc(guest.db, 'lists', list.id), { [`members.${guest.user.id}.permission`]: 'write' }));

    await host.lists.setMemberPermission(list.id, guest.user.id, 'write');
    const eggs = await guest.todos.createTodo(list.id, { title: 'Eggs' });
    await guest.todos.updateTodo(list.id, eggs.id, { completed: true });
    await guest.todos.clearCompleted(list.id);
    expect((await host.todos.getTodos(list.id)).map((t) => t.title)).toEqual(['Milk']);

    // Managing the list stays owner-only.
    await expectCode(guest.invitations.createInvitation(list.id, { kind: 'link' }), 'permission-denied');
    await expectCode(guest.lists.deleteList(list.id), 'permission-denied');
  });

  it('only lets people join with a valid invitation addressed to them', async () => {
    const host = await signIn('Host', 'host@example.com');
    const stranger = await signIn('Stranger', 'stranger@example.com');
    const list = await host.lists.createList({ title: 'Secret', icon: '🔒', color: 'red' });
    const forSomeoneElse = await host.invitations.createInvitation(list.id, { kind: 'email', email: 'friend@example.com', permission: 'write' });

    await expectCode(stranger.invitations.acceptInvitation(forSomeoneElse.id), 'permission-denied');

    // Bypassing the client checks doesn't help – the rules verify the invitation.
    const forge = (invitationId: string, permission: 'read' | 'write') => {
      const batch = writeBatch(stranger.db);
      batch.update(doc(stranger.db, 'lists', list.id), {
        [`members.${stranger.user.id}`]: {
          userId: stranger.user.id,
          displayName: 'Stranger',
          email: stranger.user.email,
          photoURL: null,
          permission,
          joinedAt: new Date().toISOString(),
          invitedBy: host.user.id,
          invitationId,
        },
        memberIds: [host.user.id, stranger.user.id],
      });
      return batch.commit();
    };
    await expectDenied(forge(forSomeoneElse.id, 'write'));
    await expectDenied(forge('made-up-id', 'read'));

    const readLink = await host.invitations.createInvitation(list.id, { kind: 'link' });
    await expectDenied(forge(readLink.id, 'write')); // permission must match the invitation
    await expectDenied(setDoc(doc(stranger.db, 'lists', list.id, 'todos', 'x'), { title: 'spam' }));
    await expectDenied(getDoc(doc(stranger.db, 'users', host.user.id)));
  });

  it('link invitations are reusable until revoked; members can leave, owners cannot', async () => {
    const host = await signIn('Host', 'host@example.com');
    const first = await signIn('First', 'first@example.com');
    const second = await signIn('Second', 'second@example.com');
    const late = await signIn('Late', 'late@example.com');

    const list = await host.lists.createList({ title: 'Trip', icon: '✈️', color: 'blue' });
    const link = await host.invitations.createInvitation(list.id, { kind: 'link', permission: 'write' });
    await first.invitations.acceptInvitation(link.id);
    await second.invitations.acceptInvitation(link.id);
    // Opening the link again is harmless.
    await second.invitations.acceptInvitation(link.id);
    expect((await host.lists.getList(list.id)).memberIds).toHaveLength(3);
    await first.todos.createTodo(list.id, { title: 'Book flights' });

    await host.invitations.revokeInvitation(link.id);
    await expectCode(late.invitations.acceptInvitation(link.id), 'failed-precondition');

    await second.lists.leaveList(list.id);
    await expectCode(second.lists.getList(list.id), 'permission-denied');
    await expectCode(host.lists.leaveList(list.id), 'failed-precondition');

    await host.lists.removeMember(list.id, first.user.id);
    await expectCode(first.todos.getTodos(list.id), 'permission-denied');
    expect((await host.lists.getList(list.id)).memberIds).toEqual([host.user.id]);
  });

  it('keeps reminders private and cleans up when the owner deletes a list', async () => {
    const host = await signIn('Host', 'host@example.com');
    const guest = await signIn('Guest', 'guest@example.com');
    const list = await host.lists.createList({ title: 'Gig', icon: 'glyph:electric-guitar', color: 'red' });
    const todo = await host.todos.createTodo(list.id, { title: 'Soundcheck' });
    const invitation = await host.invitations.createInvitation(list.id, { kind: 'email', email: guest.user.email });

    // No reminders for lists you can't read.
    await expectCode(guest.reminders.setReminder(list.id, todo.id, '2030-01-01T09:00:00.000Z'), 'permission-denied');
    await guest.invitations.acceptInvitation(invitation.id);
    const reminder = await guest.reminders.setReminder(list.id, todo.id, '2030-01-01T09:00:00.000Z');
    await guest.reminders.markFired(reminder.id);
    expect((await guest.reminders.getReminder(reminder.id))?.firedAt).not.toBeNull();
    expect(await host.reminders.getMyReminders()).toEqual([]);
    await expectDenied(getDoc(doc(host.db, 'users', guest.user.id, 'reminders', reminder.id)));

    await host.invitations.createInvitation(list.id, { kind: 'link' });
    await host.lists.deleteList(list.id);
    expect(await host.lists.getMyLists()).toEqual([]);
    expect(await host.invitations.getListInvitations(list.id)).toEqual([]);
    await expectCode(guest.todos.getTodos(list.id), 'permission-denied');
  });
});
