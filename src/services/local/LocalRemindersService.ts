import { AppError } from '@/domain/errors';
import { assertCanRead } from '@/domain/permissions';
import { reminderIdOf, type ISODateString, type ListId, type Reminder, type ReminderId, type TodoId, type TodoList } from '@/domain/types';
import type { DocumentStore } from '../storage/DocumentStore';
import type { AuthService, RemindersService } from '../types';
import { paths } from './collections';
import { nowISO, requireUser } from './session';

/**
 * Reminders live under the user (`users/{uid}/reminders`), so security rules stay trivial:
 * `allow read, write: if request.auth.uid == uid` – plus list read access on create.
 */
export class LocalRemindersService implements RemindersService {
  constructor(
    private readonly store: DocumentStore,
    private readonly auth: AuthService,
  ) {}

  async getMyReminders(): Promise<Reminder[]> {
    const user = requireUser(this.auth);
    return this.store.query<Reminder>(paths.reminders(user.id));
  }

  async getReminder(reminderId: ReminderId): Promise<Reminder | null> {
    const user = requireUser(this.auth);
    return this.store.get<Reminder>(paths.reminder(user.id, reminderId));
  }

  async setReminder(listId: ListId, todoId: TodoId, remindAt: ISODateString): Promise<Reminder> {
    const user = requireUser(this.auth);
    const list = await this.store.get<TodoList>(paths.list(listId));
    if (!list) throw new AppError('not-found', 'listNotFound');
    assertCanRead(list, user.id);
    if (Number.isNaN(Date.parse(remindAt))) throw new AppError('invalid-argument', 'invalidReminderTime');

    const id = reminderIdOf(listId, todoId);
    const existing = await this.store.get<Reminder>(paths.reminder(user.id, id));
    const now = nowISO();
    const reminder: Reminder = {
      id,
      userId: user.id,
      listId,
      todoId,
      remindAt,
      firedAt: null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await this.store.set(paths.reminder(user.id, id), reminder);
    return reminder;
  }

  async removeReminder(reminderId: ReminderId): Promise<void> {
    const user = requireUser(this.auth);
    await this.store.delete(paths.reminder(user.id, reminderId));
  }

  async markFired(reminderId: ReminderId): Promise<void> {
    const user = requireUser(this.auth);
    await this.store.update<Reminder>(paths.reminder(user.id, reminderId), { firedAt: nowISO() });
  }

  watchMyReminders(onChange: () => void) {
    const user = this.auth.getCurrentUser();
    if (!user) return () => {};
    return this.store.subscribe(`${paths.reminders(user.id)}/`, onChange);
  }
}
