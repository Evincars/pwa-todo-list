import { beforeEach, describe, expect, it } from 'vitest';
import type { AppError } from '@/domain/errors';
import { createLocalServices, type LocalServices } from './createServices';
import type { MockAccount } from './local/MockAuthService';

const HOST: MockAccount = { displayName: 'Host', email: 'host@example.com' };
const GUEST: MockAccount = { displayName: 'Guest', email: 'guest@example.com' };
const STRANGER: MockAccount = { displayName: 'Stranger', email: 'stranger@example.com' };

const signInAs = async (services: LocalServices, account: MockAccount) => {
  services.auth.setAccountPicker(async () => account);
  return (await services.auth.signIn('google')).user;
};

const expectCode = async (promise: Promise<unknown>, code: AppError['code']) => {
  await expect(promise).rejects.toMatchObject({ code });
};

describe('list sharing & permissions', () => {
  let services: LocalServices;

  beforeEach(async () => {
    localStorage.clear();
    services = createLocalServices();
    await services.auth.initialize();
  });

  it('invited members get read access by default and the host can grant write', async () => {
    await signInAs(services, HOST);
    const list = await services.lists.createList({ title: 'Groceries', icon: '🛒', color: 'teal' });
    await services.todos.createTodo(list.id, { title: 'Milk', priority: 'high' });
    const invitation = await services.invitations.createInvitation(list.id, { kind: 'email', email: GUEST.email });
    expect(invitation.permission).toBe('read');

    const guest = await signInAs(services, GUEST);
    expect(await services.invitations.getMyInvitations()).toHaveLength(1);
    await services.invitations.acceptInvitation(invitation.id);

    // Guest sees exactly the same data …
    expect((await services.lists.getMyLists()).map((l) => l.id)).toEqual([list.id]);
    expect((await services.todos.getTodos(list.id)).map((t) => t.title)).toEqual(['Milk']);
    // … but cannot modify it.
    await expectCode(services.todos.createTodo(list.id, { title: 'Eggs' }), 'permission-denied');
    await expectCode(services.lists.updateList(list.id, { title: 'Mine now' }), 'permission-denied');

    await signInAs(services, HOST);
    await services.lists.setMemberPermission(list.id, guest.id, 'write');

    await signInAs(services, GUEST);
    const eggs = await services.todos.createTodo(list.id, { title: 'Eggs' });
    await services.todos.updateTodo(list.id, eggs.id, { completed: true });
    // Managing the list stays owner-only.
    await expectCode(services.invitations.createInvitation(list.id, { kind: 'link' }), 'permission-denied');
  });

  it('e-mail invitations are bound to the address, links can be reused until revoked', async () => {
    await signInAs(services, HOST);
    const list = await services.lists.createList({ title: 'Trip', icon: '✈️', color: 'blue' });
    const emailInvite = await services.invitations.createInvitation(list.id, { kind: 'email', email: GUEST.email });
    const link = await services.invitations.createInvitation(list.id, { kind: 'link', permission: 'write' });

    await signInAs(services, STRANGER);
    await expectCode(services.invitations.acceptInvitation(emailInvite.id), 'permission-denied');
    await services.invitations.acceptInvitation(link.id);
    expect((await services.lists.getList(list.id)).members).toHaveProperty([services.auth.getCurrentUser()!.id, 'permission'], 'write');

    await signInAs(services, HOST);
    await services.invitations.revokeInvitation(link.id);

    await signInAs(services, GUEST);
    await expectCode(services.invitations.acceptInvitation(link.id), 'failed-precondition');
    await services.invitations.acceptInvitation(emailInvite.id);
    await expectCode(services.invitations.acceptInvitation(emailInvite.id), 'failed-precondition');
  });

  it('removed members lose access; deleting a list removes its todos', async () => {
    const host = await signInAs(services, HOST);
    const list = await services.lists.createList({ title: 'Chores', icon: '🧹', color: 'orange' });
    const invite = await services.invitations.createInvitation(list.id, { kind: 'link' });

    const guest = await signInAs(services, GUEST);
    await services.invitations.acceptInvitation(invite.id);

    await signInAs(services, HOST);
    await services.lists.removeMember(list.id, guest.id);
    await services.todos.createTodo(list.id, { title: 'Vacuum' });

    await signInAs(services, GUEST);
    await expectCode(services.todos.getTodos(list.id), 'permission-denied');
    expect(await services.lists.getMyLists()).toEqual([]);

    await signInAs(services, HOST);
    expect(host.id).toBe(services.auth.getCurrentUser()!.id);
    await services.lists.deleteList(list.id);
    await expectCode(services.todos.getTodos(list.id), 'not-found');
    expect(Object.keys(localStorage).filter((key) => key.includes(list.id))).toEqual([]);
  });

  it('notifies watchers on changes (real-time emulation)', async () => {
    await signInAs(services, HOST);
    const list = await services.lists.createList({ title: 'Live', icon: '📝', color: 'blue' });
    let calls = 0;
    const unsubscribe = services.todos.watchTodos(list.id, () => calls++);
    await services.todos.createTodo(list.id, { title: 'Ping' });
    unsubscribe();
    await services.todos.createTodo(list.id, { title: 'Pong' });
    expect(calls).toBe(1);
  });

  it('reminders are personal – read-only members can set their own, others never see them', async () => {
    await signInAs(services, HOST);
    const list = await services.lists.createList({ title: 'Gig', icon: 'glyph:electric-guitar', color: 'red' });
    const todo = await services.todos.createTodo(list.id, { title: 'Soundcheck' });
    const invitation = await services.invitations.createInvitation(list.id, { kind: 'email', email: GUEST.email });
    await services.reminders.setReminder(list.id, todo.id, '2030-01-01T12:00:00.000Z');

    await signInAs(services, GUEST);
    expect(await services.reminders.getMyReminders()).toEqual([]);
    await expectCode(services.reminders.setReminder(list.id, todo.id, '2030-01-01T09:00:00.000Z'), 'permission-denied');
    await services.invitations.acceptInvitation(invitation.id);
    const guestReminder = await services.reminders.setReminder(list.id, todo.id, '2030-01-01T09:00:00.000Z');
    await services.reminders.markFired(guestReminder.id);
    expect((await services.reminders.getReminder(guestReminder.id))?.firedAt).not.toBeNull();

    await signInAs(services, HOST);
    const [hostReminder] = await services.reminders.getMyReminders();
    expect(hostReminder).toMatchObject({ todoId: todo.id, remindAt: '2030-01-01T12:00:00.000Z', firedAt: null });
  });
});
