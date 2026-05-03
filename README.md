# SYNKIFY

SYNKIFY is a Firebase-backed personal app repo.

## Local Setup

```powershell
npm ci
npm run dev
```

## Validation

```powershell
npm run lint
npm run typecheck
npm run build
```

## Environment

Configure Firebase with the `VITE_FIREBASE_*` variables used by `src/api/firebaseSynkifyClient.js`.

Optional local fallback:

```text
VITE_USE_LOCAL_SYNKIFY=true
```
