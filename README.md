# Shared Todo (PWA)

A mobile-first, installable todo app with shared lists, backed by Firebase (Firestore + Google / Facebook sign-in). The list host invites people, who get **read** access by default. The host can upgrade anyone to **write** or remove them.

## Stack

| Concern        | Choice                                                                   |
| -------------- | ------------------------------------------------------------------------ |
| Build          | Vite 8, TypeScript 6 (strict, `noUncheckedIndexedAccess`)                |
| UI             | React 19, Mantine 9 (`core`, `dates`, `form`, `notifications`), Tabler icons |
| Routing        | TanStack Router (file-based, typed search params with zod, hash history) |
| Server state   | TanStack Query (optimistic mutations, live invalidation)                 |
| Client state   | Zustand (auth mirror, persisted settings, dialog bridges)                |
| Backend        | Firebase Auth + Firestore (offline cache, real-time listeners, security rules) |
| i18n           | i18next + react-i18next (typed keys), dayjs locales – English, Czech     |
| PWA            | vite-plugin-pwa (Workbox precache, update prompt, install button)        |
| Tests          | Vitest + jsdom                                                           |

## Scripts

```bash
npm run dev            # dev server against the real Firebase project
npm run dev:local      # dev server with localStorage + mock sign-in (no Firebase)
npm run emulators      # Firestore + Auth emulators (needs the Firebase CLI and Java)
npm run dev:emulator   # dev server against the emulators – the full stack, fully local
npm run build          # typecheck + production build (dist/)
npm run preview        # serve the build (service worker active)
npm test               # unit + local service integration tests
npm run test:firebase  # Firestore services + security rules against the emulators
npm run deploy:rules   # publish firestore.rules to the Firebase project
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
    firebase/       Firebase Auth + Firestore implementations
    createServices.ts  composition root – picks the backend (`VITE_DATA_BACKEND`)
  features/       auth, lists, todos, invitations, settings, onboarding
                  (each has api.ts with query/mutation hooks, components/, pages/)
  shared/ui/      generic, reusable UI wrappers (see below)
  theme/          theme presets + Mantine theme factory
  i18n/           i18next setup, language detection, catalogs (locales/en.ts is the source)
  lib/            query client, query keys, optimistic helper, dates, fuzzy search, notifications
```

### Reusable UI kit (`src/shared/ui`)

`ResponsiveOverlay` (popover on desktop, bottom sheet on mobile), `ResponsiveModal`, `BottomSheet`, `OptionList<T>`, `SelectMenu<T>`, `SegmentedField<T>`, `SwatchPicker<T>`, `TilePicker<T>` (grouped icon/emoji grid), `ClockTimePicker` (Material / MS To Do analog dial), `AgendaCalendar` (week strip ↔ month grid with per-day count bubbles), `CheckCircle`, `QueryView<T>` (pending/error/data switch), `PageHeader`, `SettingsSection`/`SettingsRow`, `UserAvatar`/`AvatarStack`, and a promise-based `confirm()` dialog.

## Data model (Firestore)

```
users/{uid}                        UserProfile
lists/{listId}                     TodoList { icon, owner, members: {uid: {permission: 'read'|'write'}}, memberIds[] }
lists/{listId}/todos/{todoId}      Todo { priority, dueAt, dueHasTime, completed, createdBy, ... }
invitations/{invitationId}         Invitation { kind: 'email'|'link', listId, email, permission, status, expiresAt }
users/{uid}/reminders/{listId_todoId}  Reminder { listId, todoId, remindAt, firedAt }
```

A list `icon` is either an emoji or a vector glyph token such as `glyph:radioactive`. The glyph registry is in `src/features/lists/listIcons.tsx`. Older local data that stored `emoji` is migrated when the app starts (`src/services/local/migrations.ts`).

With the local backend (`npm run dev:local`), each document is one `localStorage` key: `shared-todo/v1:<path>`, and changes are broadcast across tabs as a stand-in for Firestore listeners.

**Access rules** live in `src/domain/permissions.ts`, which both the UI and the services use. `firestore.rules` enforces them on the server:

- owner: everything, including inviting, changing permissions, removing members and deleting the list
- `write`: create, edit, complete and delete todos
- `read`: view only
- E-mail invitations only work for that address and can be used once. Link invitations can be used many times until they are revoked or expire (after 14 days).

## App icon

`public/logo.svg` is the source: an orange rounded square with a house and a check-mark door ("done at home"). `npm run generate-pwa-assets` renders the favicon, the PWA icons (64/192/512), the maskable 512 px icon and the 180 px Apple touch icon (`pwa-assets.config.ts`). The maskable and Apple icons are full-bleed orange, so the OS shapes them without white borders.

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
- Facebook also shares the profile picture (see the Firebase section).
- In the mock, the Google and Facebook demo accounts come with bundled portraits (`public/avatars/`), and "Use another account" accepts an optional photo URL.

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
- **Closed app:** the in-app scheduler only works while the app is running. To deliver reminders when the app is closed, store FCM tokens per user. A scheduled Cloud Function then queries `collectionGroup('reminders').where('firedAt', '==', null).where('remindAt', '<=', now)`, sends a web push for each one, and sets `firedAt`.

## Firebase

The data layer talks to Firebase whenever `VITE_DATA_BACKEND=firebase`, which is the default in `.env`. The web config in `.env` identifies the project and is public by design. Access is protected by Auth, the authorized domains and `firestore.rules`.

- **Sign-in:** `FirebaseAuthService` uses `signInWithPopup`. Redirect sign-in doesn't work on hosts other than `*.firebaseapp.com`, such as GitHub Pages. The profile is built from the Firebase user, including the Google photo, so a signed-in session also restores offline. `VITE_AUTH_PROVIDERS` controls which buttons are shown (`google`, `facebook`, `apple`). Apple is implemented but hidden by default.
- **Facebook photo:** Facebook's default `photoURL` is a tiny Graph API URL that needs a token. At sign-in the app resolves a full-size picture with the access token and stores it on the Firebase user. The picture link expires after a while: the next sign-in refreshes it, and initials are shown until then.
- **One account per e-mail:** Firebase's default. If an address already signed in with Google, signing in with Facebook using the same e-mail shows a message asking the person to use Google.
- **Firestore:** `src/services/firebase/Firestore*Service.ts` uses a persistent multi-tab cache (works offline, writes sync when back online) and `onSnapshot` for live updates. Membership changes use field paths and `arrayUnion` / `arrayRemove`.
- **Joining without a Cloud Function:**
  - The invitee writes themselves into `list.members` in one batch with the invitation update.
  - `firestore.rules` allows it only when `members.<uid>.invitationId` points to a pending invitation for that list, with the same permission and, for e-mail invitations, the signed-in e-mail.
  - This keeps the project on the free Spark plan.
  - Known gap: invitation expiry is checked only by the client, because dates are stored as ISO strings. Revoking an invitation is enforced by the rules.
- **Tests:** `npm run test:firebase` runs the real services against the Firestore and Auth emulators under the `demo-` project namespace. It includes attacks the UI never makes, such as forged joins, a member raising their own permission, and reading someone else's reminders. With permissive rules all four tests fail, so they really exercise the rules.

### Setup checklist (Firebase console, project `pwa-todo-lists`)

1. **Authentication → Sign-in method → Google → Enable.** Pick the public-facing name (e.g. "Shared Todo") and the support e-mail.
2. **Authentication → Settings → Authorized domains:** add `evincars.github.io`. `localhost` is already there for `npm run dev`.
3. **Firestore rules:** run `npm run deploy:rules` (Firebase CLI, `firebase login`), or paste `firestore.rules` into Firestore → Rules → Publish.
4. Optional: in Google Cloud console → APIs & Services → Credentials, restrict the browser API key to your domains.
5. **Facebook login:**
   1. At [developers.facebook.com](https://developers.facebook.com/apps), create an app of the type "Authenticate and request data from users with Facebook Login".
   2. Firebase → Authentication → Sign-in method → Facebook → Enable. Paste the app's **App ID** and **App secret** (Facebook app → App settings → Basic).
   3. Facebook app → Facebook Login → Settings → **Valid OAuth Redirect URIs**: add `https://pwa-todo-lists.firebaseapp.com/__/auth/handler`. This is the URL Firebase shows on the Facebook provider page.
   4. Facebook app → App settings → Basic: add the **App domains** `pwa-todo-lists.firebaseapp.com` and `evincars.github.io`, and a **Privacy policy URL** (required to go Live).
   5. While the app is in **Development** mode, only people with a role in the app (admins, developers, testers) can sign in. Switch it to **Live** for everyone.
6. Apple sign-in (hidden) needs an Apple Developer account (Services ID, key). Then enable "Apple" in Firebase Auth and add `apple` to `VITE_AUTH_PROVIDERS`.

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` lints, tests, builds and deploys to GitHub Pages whenever a `v*` tag is pushed. The version shown in Settings comes from the tag.

```bash
npm version patch          # or minor / major – bumps package.json, commits and creates the tag v0.1.1
git push --follow-tags     # pushes the commit and the tag → build & deploy
```

One-time setup: in the repository, go to Settings → Pages → Source and choose **GitHub Actions**. The app uses a relative base and hash routing, so it works under `https://<user>.github.io/pwa-todo-list/` without any base-URL configuration. The workflow can also be started manually (Actions → Run workflow).

## Trying out sharing locally

With Firebase, use two browsers (or a private window) and two Google accounts. Without Firebase, run `npm run dev:local`: everything is stored in one browser, so you can try sharing by switching accounts. Sign in as *Alex*, open a list, then go to the members icon → invite `sam.rivera@gmail.com`. Sign out, sign in as *Sam*, accept the invitation (you have read-only access), then switch back to Alex and grant edit access.
