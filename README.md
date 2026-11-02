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
| i18n           | i18next + react-i18next (typed keys), dayjs locales – English, Czech     |
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
  i18n/           i18next setup, language detection, catalogs (locales/en.ts is the source)
  lib/            query client, query keys, optimistic helper, dates, fuzzy search, notifications
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

## Translations

Every user-facing string goes through i18next (`useTranslation()` in components, `t()` from `@/i18n` elsewhere). React has no built-in i18n like Angular, and i18next is the most widely used library for it.

- `src/i18n/locales/en.ts` is the source catalog. Its type makes keys autocomplete and type-check (`t('todos.add')`).
- `cs.ts` must have the same shape (`satisfies Catalog<EnCatalog>`), so a missing key is a compile error. Czech plurals add `_few` (2–4) next to `_one` and `_other`.
- Date formats are part of the catalog (`dates.format.*`), because Czech uses numeric dates ("po 2. 11.") instead of month names.
- The data layer never returns display text. Services throw `AppError(code, reason)`, and the UI translates `errors.<reason>`.
- Language: Settings → Language. The default, "System", uses the first supported language from `navigator.languages`, which follows the phone or browser language on iOS and Android. Changing it switches dayjs, Mantine date pickers and `<html lang>` as well.
- To add a language: copy `cs.ts`, translate it, and register it in `SUPPORTED_LANGUAGES` and `LANGUAGE_NAMES` (`src/i18n/i18n.ts`).

## Search

The search box matches task titles fuzzily (`src/lib/fuzzy.ts`). The characters of the query only need to appear in order, so `tewi` finds "Set a due da**te** **wi**th quick picks". Matches at word starts and consecutive letters rank higher, and case and diacritics are ignored. While searching, results are sorted by relevance and the matched characters are highlighted in the theme color. Notes are matched by plain substring.

## Profile photos

- Google returns the account photo (`user.photoURL`), and the app stores it on the profile at every sign-in.
- Apple Sign-In never shares a photo, so initials are shown instead. The same initials are the fallback when an image fails to load.
- In the mock, the Google demo accounts come with bundled portraits (`public/avatars/`), and "Use another account" accepts an optional photo URL.

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

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` lints, tests, builds and deploys to GitHub Pages whenever a `v*` tag is pushed. The version shown in Settings comes from the tag.

```bash
npm version patch          # or minor / major – bumps package.json, commits and creates the tag v0.1.1
git push --follow-tags     # pushes the commit and the tag → build & deploy
```

One-time setup: in the repository, go to Settings → Pages → Source and choose **GitHub Actions**. The app uses a relative base and hash routing, so it works under `https://<user>.github.io/pwa-todo-list/` without any base-URL configuration. The workflow can also be started manually (Actions → Run workflow).

## Trying out sharing locally

Everything is stored in one browser, so you can try sharing by switching accounts. Sign in as *Alex*, open a list, then go to the members icon → invite `sam.rivera@gmail.com`. Sign out, sign in as *Sam*, accept the invitation (you have read-only access), then switch back to Alex and grant edit access.
