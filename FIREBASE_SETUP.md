# Firebase Setup

Use Firebase for Synkify auth, database, and image storage.

## Firebase Console

1. Create a Firebase project.
2. Add a Web app.
3. Enable Authentication > Sign-in method > Google.
4. Add authorized domains:
   - `localhost`
   - `127.0.0.1`
   - `synkify.app`
5. Create Firestore Database in production mode.
6. Enable Storage.

## Local Environment

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Copy these values from Firebase Console > Project settings > Your apps > SDK setup and configuration.

Restart the Vite dev server after changing `.env.local`.

## Cloudflare Environment

Add the same variables in Cloudflare Pages/Workers build settings as production environment variables.

## Rules

Paste `firestore.rules` into Firestore Rules and `storage.rules` into Storage Rules before real users start using the app.
