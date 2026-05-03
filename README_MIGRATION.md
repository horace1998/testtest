# SYNKIFY Base44 Decoupling Migration

## Status

The `base44/` directory is deprecated.

SYNKIFY should treat `base44/` as legacy reference material only. Runtime data access, auth, storage, and function behavior should live under `src/` and use Firebase directly. New work should not add code paths that depend on `base44/functions`, `base44/entities`, Base44 environment variables, or the Base44 SDK.

## Migrated Leave Mission Logic

The final `leaveMission` behavior has been merged into `src/api/firebaseSynkifyClient.js`.

Current Firebase behavior:

- Load the mission by `mission_id`.
- Read the current participant count from `mission.members`.
- Remove the leaving user's member record.
- If no participants remain, delete the mission document.
- If participants remain, update `members` and `member_count`.
- Mark the supplied linked goal as `abandoned`.
- Return deletion and count metadata.

Because the Active Missions list is backed by active `Mission` records, deleting the empty mission also removes public ghost missions from the global feed/list.

## Remaining Base44-Coupled Source References

There are no literal `src` imports that point into the deprecated `base44/` directory.

The remaining coupling is naming/API compatibility through `@/api/base44Client`, `@base44/sdk`, Base44 env vars, and Base44 local storage keys.

### Direct Base44 SDK references

- `src/api/base44Client.js`
  - `import { createClient } from '@base44/sdk';`
  - `VITE_BASE44_APP_ID`
  - `VITE_BASE44_APP_BASE_URL`
  - `VITE_USE_LOCAL_BASE44`
- `src/lib/AuthContext.jsx`
  - `import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';`
- `src/lib/app-params.js`
  - `base44_*` local storage keys
  - `base44_access_token`
  - `VITE_BASE44_APP_ID`
  - `VITE_BASE44_FUNCTIONS_VERSION`
  - `VITE_BASE44_APP_BASE_URL`

### Imports of `@/api/base44Client`

- `src/components/MilestoneCamera.jsx`
- `src/components/MilestoneNativeCapture.jsx`
- `src/components/NotificationBell.jsx`
- `src/components/PageShell.jsx`
- `src/components/SettingsModal.jsx`
- `src/components/circle/CheerInbox.jsx`
- `src/components/circle/CheerModal.jsx`
- `src/components/circle/CircleMembersFeed.jsx`
- `src/components/circle/CircleStoriesFeed.jsx`
- `src/components/circle/CircleStoryComposer.jsx`
- `src/components/circle/CircleUnifiedFeed.jsx`
- `src/components/circle/StoryReplies.jsx`
- `src/components/dashboard/HeroBanner.jsx`
- `src/components/dashboard/HeroDecorator.jsx`
- `src/components/dashboard/HeroIdentity.jsx`
- `src/components/dashboard/HeroUploadModal.jsx`
- `src/components/dashboard/IdolBackgroundManager.jsx`
- `src/components/feed/CommentsThread.jsx`
- `src/components/feed/FeedPostCard.jsx`
- `src/components/feed/ReportDialog.jsx`
- `src/components/milestones/MilestoneCard.jsx`
- `src/components/milestones/MilestoneUploadModal.jsx`
- `src/components/missions/MissionCard.jsx`
- `src/components/profile/EditProfile.jsx`
- `src/components/profile/FocusManager.jsx`
- `src/components/profile/HeroEditor.jsx`
- `src/components/profile/HeroEraser.jsx`
- `src/components/profile/HeroImageManager.jsx`
- `src/components/profile/IdentityEditor.jsx`
- `src/components/profile/ProfileImageEditor.jsx`
- `src/lib/AuthContext.jsx`
- `src/lib/leaveGoal.js`
- `src/lib/moderation.js`
- `src/lib/PageNotFound.jsx`
- `src/lib/useCheckinReminder.js`
- `src/pages/AdminModeration.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/Feed.jsx`
- `src/pages/Goals.jsx`
- `src/pages/MilestoneGallery.jsx`
- `src/pages/Missions.jsx`
- `src/pages/Onboarding.jsx`
- `src/pages/Profile.jsx`
- `src/pages/PublicProfile.jsx`
- `src/pages/SupportCircle.jsx`
- `src/pages/Tasks.jsx`

## Rename and Refactor Plan

1. Done: renamed `src/api/firebaseBase44Client.js` to `src/api/firebaseSynkifyClient.js`.
2. Done: renamed exported symbols:
   - `createFirebaseBase44Client` -> `createFirebaseSynkifyClient`
3. Next: replace `src/api/base44Client.js` with a Firebase-only facade, or create `src/api/synkifyClient.js` and migrate imports to it.
4. Next: rename the exported app client:
   - `base44` -> `synkify`
5. Update project imports:
   - `@/api/base44Client` -> `@/api/synkifyClient`
6. Update all call sites:
   - `base44.auth.*` -> `synkify.auth.*`
   - `base44.entities.*` -> `synkify.entities.*`
   - `base44.functions.invoke(...)` -> `synkify.functions.invoke(...)`
   - `base44.integrations.Core.UploadFile(...)` -> `synkify.storage.uploadFile(...)` or keep a temporary compatibility shim.
7. Remove the Base44 fallback branch from the client factory:
   - Drop `createClient` from `@base44/sdk`.
   - Drop `appParams` and Base44 env-var routing from runtime.
8. Replace `src/lib/AuthContext.jsx` public settings fetch that uses `@base44/sdk/dist/utils/axios-client`.
9. Remove Base44-specific env vars from docs/deploy config after Firebase-only boot is verified.
10. Remove `@base44/sdk` and `@base44/vite-plugin` from `package.json` after all imports and Vite plugin usage are gone.
11. Update `vite.config.js` to remove `@base44/vite-plugin`.
12. Run validation:
    - `npm run lint`
    - `npm run typecheck`
    - `npm run build`

## Local Environment Repair

This repo has a `package-lock.json`, so use `npm ci` for a clean deterministic install.

Recommended Windows terminal commands:

```powershell
cd "C:\Users\horac\Documents\Codex\Synkify-App"
npm ci
npm run lint
npm run typecheck
npm run build
```

If the existing `node_modules` folder was created by another environment and still causes permission problems, close Codex and any dev servers, then run:

```powershell
cd "C:\Users\horac\Documents\Codex\Synkify-App"
Remove-Item -Recurse -Force .\node_modules
npm ci
```
