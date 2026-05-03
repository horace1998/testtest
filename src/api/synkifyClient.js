import { createLocalSynkifyClient } from './localSynkifyClient';
import { createFirebaseSynkifyClient, hasFirebaseConfig } from './firebaseSynkifyClient';

const isBrowser = typeof window !== 'undefined';
const hostname = isBrowser ? window.location.hostname : '';
const isLocalPreview = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
const shouldUseLocalClient =
  !hasFirebaseConfig && isLocalPreview && import.meta.env.VITE_USE_LOCAL_SYNKIFY === 'true';

const createMissingFirebaseClient = () => ({
  isMissingFirebaseConfig: true,
  auth: {
    me: async () => {
      throw new Error('Production Firebase config is missing. Add VITE_FIREBASE_* build variables in Cloudflare.');
    },
    updateMe: async () => {
      throw new Error('Production Firebase config is missing. Add VITE_FIREBASE_* build variables in Cloudflare.');
    },
    logout: async () => {},
    redirectToLogin: async () => {
      throw new Error('Production Firebase config is missing. Add VITE_FIREBASE_* build variables in Cloudflare.');
    },
  },
  entities: {},
  functions: {
    invoke: async () => ({ data: { success: false, error: 'Production Firebase config is missing.' } }),
  },
  integrations: {
    Core: {
      UploadFile: async () => {
        throw new Error('Production Firebase config is missing. Add VITE_FIREBASE_* build variables in Cloudflare.');
      },
    },
  },
});

export const synkify = shouldUseLocalClient
  ? createLocalSynkifyClient()
  : hasFirebaseConfig
    ? createFirebaseSynkifyClient()
    : createMissingFirebaseClient();
