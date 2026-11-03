/**
 * Core domain model. Shapes are Firestore-friendly: plain JSON, ISO date strings,
 * denormalized member info and a `memberIds` array for `array-contains` queries.
 */

/** Nominal typing helper so ids of different entities can't be mixed up. */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type ListId = Brand<string, 'ListId'>;
export type TodoId = Brand<string, 'TodoId'>;
export type InvitationId = Brand<string, 'InvitationId'>;
export type ReminderId = Brand<string, 'ReminderId'>;

/** ISO-8601 timestamp string, e.g. `2026-11-02T18:00:00.000Z`. */
export type ISODateString = string;

export const AUTH_PROVIDERS = ['google', 'facebook', 'apple'] as const;
export type AuthProviderId = (typeof AUTH_PROVIDERS)[number];

export interface UserProfile {
  id: UserId;
  displayName: string;
  email: string;
  photoURL: string | null;
  provider: AuthProviderId;
  createdAt: ISODateString;
  lastLoginAt: ISODateString;
}

/** Permission a host can grant to an invited member. */
export type MemberPermission = 'read' | 'write';

/** Effective access of a user to a list. */
export type ListAccess = 'owner' | MemberPermission | 'none';

export interface ListMember {
  userId: UserId;
  displayName: string;
  email: string;
  photoURL: string | null;
  permission: MemberPermission;
  joinedAt: ISODateString;
  invitedBy: UserId;
  /** Invitation used to join – Firestore rules verify it when a member adds themselves. */
  invitationId?: InvitationId;
}

export interface UserSummary {
  id: UserId;
  displayName: string;
  email: string;
  photoURL: string | null;
}

/**
 * List icon token: either an emoji (`"🛒"`) or a vector glyph reference (`"glyph:radioactive"`).
 * The glyph registry lives in the UI layer, so the stored value stays a plain string.
 */
export type ListIcon = string;

export interface TodoList {
  id: ListId;
  title: string;
  icon: ListIcon;
  color: ListColor;
  owner: UserSummary;
  /** Members other than the owner, keyed by user id. */
  members: Record<string, ListMember>;
  /** Owner + member ids, enables `where('memberIds', 'array-contains', uid)`. */
  memberIds: UserId[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export const LIST_COLORS = ['blue', 'violet', 'grape', 'pink', 'red', 'orange', 'yellow', 'lime', 'teal', 'cyan'] as const;
export type ListColor = (typeof LIST_COLORS)[number];

export const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface Todo {
  id: TodoId;
  listId: ListId;
  title: string;
  notes: string;
  priority: Priority;
  /** Due date/time as ISO string, `null` when not planned. */
  dueAt: ISODateString | null;
  /** When `false`, only the date part of `dueAt` is meaningful. */
  dueHasTime: boolean;
  completed: boolean;
  completedAt: ISODateString | null;
  completedBy: UserId | null;
  createdAt: ISODateString;
  createdBy: UserSummary;
  updatedAt: ISODateString;
  updatedBy: UserId;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked';
export type InvitationKind = 'email' | 'link';

export interface Invitation {
  id: InvitationId;
  kind: InvitationKind;
  listId: ListId;
  /** Denormalized so invitees can see what they're joining before they have access. */
  listTitle: string;
  listIcon: ListIcon;
  listColor: ListColor;
  /** Target email for `email` invitations (lower-cased), `null` for shareable links. */
  email: string | null;
  permission: MemberPermission;
  invitedBy: UserSummary;
  status: InvitationStatus;
  createdAt: ISODateString;
  expiresAt: ISODateString;
  /** Users that joined through this invitation (links can be used many times). */
  acceptedBy: UserId[];
}

// ---------- Inputs ----------

/**
 * Personal reminder of a task. Stored per user (`users/{uid}/reminders/{id}`), so members of a
 * shared list – including read-only ones – get their own reminders without touching the task.
 */
export interface Reminder {
  /** `${listId}_${todoId}` – at most one reminder per user and task. */
  id: ReminderId;
  userId: UserId;
  listId: ListId;
  todoId: TodoId;
  remindAt: ISODateString;
  /** Set once the notification was delivered (or skipped because the task was done). */
  firedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export const reminderIdOf = (listId: ListId, todoId: TodoId) => `${listId}_${todoId}` as ReminderId;

export interface CreateListInput {
  title: string;
  icon: ListIcon;
  color: ListColor;
}

export type UpdateListInput = Partial<CreateListInput>;

export interface CreateTodoInput {
  title: string;
  notes?: string;
  priority?: Priority;
  dueAt?: ISODateString | null;
  dueHasTime?: boolean;
}

export type UpdateTodoInput = Partial<
  Pick<Todo, 'title' | 'notes' | 'priority' | 'dueAt' | 'dueHasTime' | 'completed'>
>;

export interface CreateInvitationInput {
  kind: InvitationKind;
  email?: string;
  permission?: MemberPermission;
}

export const toUserSummary = (user: Pick<UserProfile, 'id' | 'displayName' | 'email' | 'photoURL'>): UserSummary => ({
  id: user.id,
  displayName: user.displayName,
  email: user.email,
  photoURL: user.photoURL,
});
