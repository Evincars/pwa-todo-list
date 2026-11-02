# Shared Todo (PWA)

A mobile-first, installable todo app with shared lists. The list host invites people, who get **read** access by default. The host can upgrade anyone to **write** or remove them.

## Stack

| Concern        | Choice                                                                   |
| -------------- | ------------------------------------------------------------------------ |
| Build          | Vite 8, TypeScript 6 (strict, `noUncheckedIndexedAccess`)                |
| UI             | React 19, Mantine 9 (`core`, `dates`, `form`, `notifications`), Tabler icons |
| Routing        | TanStack Router (file-based, typed search params with zod, hash history) |
| Server state   | TanStack Query (optimistic mutations, live invalidation)                 |
| Client state   | Zustand (auth mirror, persisted settings, dialog bridges)                |
| PWA            | vite-plugin-pwa (Workbox precache, update prompt, install button)        |
| Tests          | Vitest + jsdom                                                           |

## Scripts

```bash
npm run dev        # dev server
npm run build      # typecheck + production build (dist/)
npm run preview    # serve the build (service worker active)
npm test           # unit + service integration tests
npm run lint
```

## Project layout

```
src/
  app/            providers, router, tab layout, PWA reload prompt
  routes/         thin TanStack Router file routes (guards, loaders, search params)
  domain/         framework-free model: types, permissions, priority, sorting/filtering
  services/       data layer contracts + implementations
    types.ts        AuthService / ListsService / TodosService / InvitationsService
    storage/        DocumentStore (Firestore-shaped) + LocalStorageDocumentStore
    local/          mock auth + local services (enforce the same rules Firestore will)
    createServices.ts  composition root, the single swap point
  features/       auth, lists, todos, invitations, settings, onboarding
                  (each has api.ts with query/mutation hooks, components/, pages/)
  shared/ui/      generic, reusable UI wrappers (see below)
  theme/          theme presets + Mantine theme factory
  lib/            query client, query keys, optimistic helper, dates, haptics
```

### Reusable UI kit (`src/shared/ui`)

`ResponsiveOverlay` (popover on desktop, bottom sheet on mobile), `ResponsiveModal`, `BottomSheet`, `OptionList<T>`, `SelectMenu<T>`, `SegmentedField<T>`, `SwatchPicker<T>`, `TilePicker<T>` (grouped icon/emoji grid), `ClockTimePicker` (Material / MS To Do analog dial), `AgendaCalendar` (week strip ↔ month grid with per-day count bubbles), `CheckCircle`, `QueryView<T>` (pending/error/data switch), `PageHeader`, `SettingsSection`/`SettingsRow`, `UserAvatar`/`AvatarStack`, and a promise-based `confirm()` dialog.

## Data model (Firestore-compatible)

```
users/{uid}                        UserProfile
lists/{listId}                     TodoList { icon, owner, members: {uid: {permission: 'read'|'write'}}, memberIds[] }
lists/{listId}/todos/{todoId}      Todo { priority, dueAt, dueHasTime, completed, createdBy, ... }
invitations/{invitationId}         Invitation { kind: 'email'|'link', listId, email, permission, status, expiresAt }
users/{uid}/reminders/{listId_todoId}  Reminder { listId, todoId, remindAt, firedAt }
```

A list `icon` is either an emoji or a vector glyph token such as `glyph:radioactive`. The glyph registry is in `src/features/lists/listIcons.tsx`. Older local data that stored `emoji` is migrated when the app starts (`src/services/local/migrations.ts`).

Locally, each document is one `localStorage` key: `shared-todo/v1:<path>`. Changes are broadcast within the tab and across tabs (`storage` event), which stands in for Firestore real-time listeners.

**Access rules** live in `src/domain/permissions.ts`. The UI and the services both use them:

- owner: everything, including inviting, changing permissions, removing members and deleting the list
- `write`: create, edit, complete and delete todos
- `read`: view only
- E-mail invitations only work for that address and can be used once. Link invitations can be used many times until they are revoked or expire (after 14 days).

## Reminders

- **Personal:** reminders are stored under each user, not on the task. Members of a shared list, including read-only ones, set their own reminders, and nobody else gets notified.
- **Suggested time** (`src/lib/reminderTime.ts`, unit-tested):

  | Due | Suggested reminder |
  | --- | --- |
  | Mon 15:00 | Mon 12:00 (3 hours before, never earlier than 8:00) |
  | Tue 20:00 | Tue 15:00 (5 hours before, for evening tasks) |
  | Mon 7:00 | Sun 19:00 (the evening before, for tasks before 10:00) |
  | All-day | That day at 9:00 |

  If the suggested time has already passed, the reminder falls back to 30 minutes before the due time. The reminder field is optional. The suggestion is the first quick pick, and there is a setting to apply it automatically to new tasks that have a due date.
- **Delivery today:** `useReminderScheduler` runs inside the app.
  - It schedules timers and catches up when the app becomes visible again.
  - It skips tasks that are completed or deleted, and Web Locks stop two tabs from firing the same reminder.
  - When the app is in the background, it shows a system notification (`ServiceWorkerRegistration.showNotification`). When the app is on screen, it shows an in-app toast.
  - Tapping a notification opens the task. The `notificationclick` handler is in `public/sw-notifications.js`.
  - The app asks for notification permission the first time someone sets a reminder. On iOS 16.4+, notifications only work after the app is added to the Home Screen.
- **With Firebase:** the in-app scheduler only works while the app is running. To deliver reminders when the app is closed, store FCM tokens per user. A scheduled Cloud Function then queries `collectionGroup('reminders').where('firedAt', '==', null).where('remindAt', '<=', now)`, sends a web push for each one, and sets `firedAt`.

## Migrating to Firebase

1. Implement `Services` from `src/services/types.ts`:
   - `FirebaseAuthService`: `signInWithPopup` with `GoogleAuthProvider` / `OAuthProvider('apple.com')`. `initialize()` → `auth.authStateReady()`. `isNewUser` → `getAdditionalUserInfo(result)`.
   - Firestore services: either a `FirestoreDocumentStore` that implements `DocumentStore` (the methods map 1:1 to `getDoc`/`setDoc`/`updateDoc`/`deleteDoc`/`query+where`/`writeBatch`/`onSnapshot`), or dedicated Firestore services.
2. Turn `src/domain/permissions.ts` into `firestore.rules`.
3. Move `acceptInvitation` to a callable Cloud Function, because the invitee can't write `list.members` yet. Also add the reminder push function described above.
4. Switch the export in `src/services/createServices.ts`. Then delete `MockAccountPickerHost`, `accountPickerStore` and `demoAccounts`.

No feature code needs to change.

## Trying out sharing locally

Everything is stored in one browser, so you can try sharing by switching accounts. Sign in as *Alex*, open a list, then go to the members icon → invite `sam.rivera@gmail.com`. Sign out, sign in as *Sam*, accept the invitation (you have read-only access), then switch back to Alex and grant edit access.
