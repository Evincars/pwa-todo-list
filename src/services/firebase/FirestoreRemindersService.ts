import { deleteDoc, getDoc, getDocs, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { AppError } from '@/domain/errors';
import { reminderIdOf, type ISODateString, type ListId, type Reminder, type ReminderId, type TodoId, type UserId } from '@/domain/types';
import { requireUser } from '../session';
import type { AuthService, RemindersService } from '../types';
import { guard, nowISO, typedCollection, typedDoc, watch } from './helpers';

/** `users/{uid}/reminders` – private to the user; creating one requires read access to the list (rules). */
export class FirestoreRemindersService implements RemindersService {
  constructor(
    private readonly db: Firestore,
    private readonly auth: AuthService,
  ) {}

  private reminders = (userId: UserId) => typedCollection<Reminder>(this.db, 'users', userId, 'reminders');
  private reminderRef = (userId: UserId, id: ReminderId) => typedDoc<Reminder>(this.db, 'users', userId, 'reminders', id);

  getMyReminders = () =>
    guard(async () => {
      const user = requireUser(this.auth);
      return (await getDocs(this.reminders(user.id))).docs.map((d) => d.data());
    });

  getReminder = (reminderId: ReminderId) =>
    guard(async () => {
      const user = requireUser(this.auth);
      return (await getDoc(this.reminderRef(user.id, reminderId))).data() ?? null;
    });

  setReminder = (listId: ListId, todoId: TodoId, remindAt: ISODateString) =>
    guard(async () => {
      const user = requireUser(this.auth);
      if (Number.isNaN(Date.parse(remindAt))) throw new AppError('invalid-argument', 'invalidReminderTime');
      const id = reminderIdOf(listId, todoId);
      const ref = this.reminderRef(user.id, id);
      const existing = (await getDoc(ref)).data();
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
      await setDoc(ref, reminder);
      return reminder;
    });

  removeReminder = (reminderId: ReminderId) =>
    guard(async () => {
      const user = requireUser(this.auth);
      await deleteDoc(this.reminderRef(user.id, reminderId));
    });

  markFired = (reminderId: ReminderId) =>
    guard(async () => {
      const user = requireUser(this.auth);
      await updateDoc(this.reminderRef(user.id, reminderId), { firedAt: nowISO() });
    });

  watchMyReminders(onChange: () => void) {
    const user = this.auth.getCurrentUser();
    return user ? watch(this.reminders(user.id), onChange) : () => {};
  }
}
