import type {
  AuthProviderId,
  CreateInvitationInput,
  CreateListInput,
  CreateTodoInput,
  Invitation,
  InvitationId,
  ISODateString,
  ListId,
  MemberPermission,
  Reminder,
  ReminderId,
  Todo,
  TodoId,
  TodoList,
  UpdateListInput,
  UpdateTodoInput,
  UserId,
  UserProfile,
} from '@/domain/types';
import type { Unsubscribe } from './storage/DocumentStore';

export type { Unsubscribe };

/**
 * Service contracts consumed by the app. The UI depends only on these interfaces,
 * so swapping the local mock for Firebase means providing new implementations
 * in `createServices` – nothing else changes.
 */

export interface SignInResult {
  user: UserProfile;
  isNewUser: boolean;
}

export interface AuthService {
  /** Sign-in providers enabled for this deployment. */
  readonly providers: readonly AuthProviderId[];
  /** Resolves the persisted session (Firebase: `auth.authStateReady()`). */
  initialize(): Promise<UserProfile | null>;
  getCurrentUser(): UserProfile | null;
  /** Throws `AppError('cancelled')` when the user closes the provider dialog. */
  signIn(provider: AuthProviderId): Promise<SignInResult>;
  signOut(): Promise<void>;
  onAuthStateChanged(listener: (user: UserProfile | null) => void): Unsubscribe;
}

export interface ListsService {
  /** Lists owned by or shared with the current user. */
  getMyLists(): Promise<TodoList[]>;
  getList(listId: ListId): Promise<TodoList>;
  createList(input: CreateListInput): Promise<TodoList>;
  updateList(listId: ListId, input: UpdateListInput): Promise<TodoList>;
  deleteList(listId: ListId): Promise<void>;
  setMemberPermission(listId: ListId, userId: UserId, permission: MemberPermission): Promise<TodoList>;
  removeMember(listId: ListId, userId: UserId): Promise<TodoList>;
  leaveList(listId: ListId): Promise<void>;
  watchMyLists(onChange: () => void): Unsubscribe;
  watchList(listId: ListId, onChange: () => void): Unsubscribe;
}

export interface TodosService {
  getTodos(listId: ListId): Promise<Todo[]>;
  createTodo(listId: ListId, input: CreateTodoInput, id?: TodoId): Promise<Todo>;
  updateTodo(listId: ListId, todoId: TodoId, input: UpdateTodoInput): Promise<Todo>;
  deleteTodo(listId: ListId, todoId: TodoId): Promise<void>;
  clearCompleted(listId: ListId): Promise<void>;
  watchTodos(listId: ListId, onChange: () => void): Unsubscribe;
}

export interface InvitationsService {
  createInvitation(listId: ListId, input: CreateInvitationInput): Promise<Invitation>;
  getInvitation(invitationId: InvitationId): Promise<Invitation>;
  /** Pending invitations of a list – owner only. */
  getListInvitations(listId: ListId): Promise<Invitation[]>;
  /** Pending e-mail invitations addressed to the current user. */
  getMyInvitations(): Promise<Invitation[]>;
  acceptInvitation(invitationId: InvitationId): Promise<TodoList>;
  declineInvitation(invitationId: InvitationId): Promise<void>;
  revokeInvitation(invitationId: InvitationId): Promise<void>;
  watchInvitations(onChange: () => void): Unsubscribe;
}

/** Personal reminders of the signed-in user (other members never see them). */
export interface RemindersService {
  getMyReminders(): Promise<Reminder[]>;
  getReminder(reminderId: ReminderId): Promise<Reminder | null>;
  /** Creates or replaces the reminder of a task; requires read access to the list. */
  setReminder(listId: ListId, todoId: TodoId, remindAt: ISODateString): Promise<Reminder>;
  removeReminder(reminderId: ReminderId): Promise<void>;
  markFired(reminderId: ReminderId): Promise<void>;
  watchMyReminders(onChange: () => void): Unsubscribe;
}

export type BackendKind = 'local' | 'firebase';

export interface Services {
  readonly backend: BackendKind;
  auth: AuthService;
  lists: ListsService;
  todos: TodosService;
  invitations: InvitationsService;
  reminders: RemindersService;
  /** Wipes all locally stored data – local backend only (dev/demo helper). */
  resetData?(): Promise<void>;
}
