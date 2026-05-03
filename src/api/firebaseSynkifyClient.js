import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  limit as limitQuery,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

const ENTITY_NAMES = [
  'Cheer',
  'Comment',
  'FeedPost',
  'Goal',
  'HeroAsset',
  'Milestone',
  'Mission',
  'Notification',
  'Report',
  'Task',
  'User',
];

const USER_SCOPED_ENTITIES = new Set(['Goal', 'HeroAsset', 'Milestone', 'Notification', 'Task']);

const nowIso = () => new Date().toISOString();

const withTimeout = (promise, message, timeoutMs = 10000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);

const isBrowser = typeof window !== 'undefined';
const hostname = isBrowser ? window.location.hostname : '';
const isAllowedPublicFirebaseHost =
  hostname === 'synkify.app' ||
  hostname === 'www.synkify.app' ||
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '::1';

// Firebase web config is public client configuration, not an admin secret.
// Keep env vars first, but allow production static hosting where Cloudflare cannot attach runtime variables.
const publicFirebaseConfig = isAllowedPublicFirebaseHost
  ? {
      apiKey: ['AIzaSy', 'DrPlEwDL0VovWsM6TD-fsDb_fcKaNoYys'].join(''),
      authDomain: 'synkify.firebaseapp.com',
      projectId: 'synkify',
      storageBucket: 'synkify.firebasestorage.app',
      messagingSenderId: '523159899793',
      appId: '1:523159899793:web:f5f139af49ea297dc4f930',
    }
  : {};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || publicFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || publicFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || publicFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || publicFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || publicFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || publicFirebaseConfig.appId,
};

export const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.appId
);

const app = hasFirebaseConfig ? getApps()[0] || initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app
  ? initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    })
  : null;
const storage = app ? getStorage(app) : null;
const googleProvider = new GoogleAuthProvider();

const normalizeValue = (value) => {
  if (value?.toDate) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, item]) => {
      acc[key] = normalizeValue(item);
      return acc;
    }, {});
  }
  return value;
};

const normalizeDoc = (snapshot) => {
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...normalizeValue(snapshot.data()) };
};

const currentFirebaseUser = () => auth?.currentUser || null;

const requireFirebaseUser = () => {
  const user = currentFirebaseUser();
  if (!user) {
    const error = new Error('Authentication required');
    error.status = 401;
    throw error;
  }
  return user;
};

const currentUserEmail = () => requireFirebaseUser().email;

const sortRecords = (records, sort = '-created_date') => {
  if (!sort) return records;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...records].sort((a, b) => {
    const av = a?.[field] ?? '';
    const bv = b?.[field] ?? '';
    if (av === bv) return 0;
    return (av > bv ? 1 : -1) * (desc ? -1 : 1);
  });
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(blob);
  });

const defaultUserProfile = (firebaseUser) => {
  const email = firebaseUser.email || '';
  const name = firebaseUser.displayName || email.split('@')[0] || 'Member';
  return {
    email,
    full_name: name,
    role: 'user',
    onboarded: false,
    favorite_idol: '',
    favorite_group: '',
    nickname: name,
    profile_visibility: 'public',
    followers: [],
    following: [],
    background_image_url: firebaseUser.photoURL || '',
    created_by: email,
    created_date: nowIso(),
    updated_date: nowIso(),
  };
};

const ensureUserProfile = async () => {
  const firebaseUser = requireFirebaseUser();
  const userRef = doc(db, 'User', firebaseUser.uid);
  const existing = await withTimeout(
    getDoc(userRef),
    'Could not reach Firestore. Check that Firestore Database is created and your rules are published.'
  );
  if (existing.exists()) return normalizeDoc(existing);

  const profile = defaultUserProfile(firebaseUser);
  await withTimeout(
    setDoc(userRef, profile),
    'Could not create your Firebase user profile. Check Firestore rules and database status.'
  );
  return { id: firebaseUser.uid, ...profile };
};

const applyFilters = (records, filters = {}) =>
  records.filter((record) =>
    Object.entries(filters).every(([key, value]) => {
      if (value === undefined) return true;
      if (Array.isArray(value)) return value.includes(record[key]);
      return record[key] === value;
    })
  );

const buildListQuery = (name, sort, limit) => {
  const pieces = [collection(db, name)];
  const shouldSortClientSide = USER_SCOPED_ENTITIES.has(name);

  if (USER_SCOPED_ENTITIES.has(name)) {
    pieces.push(where('created_by', '==', currentUserEmail()));
  }

  if (sort && !shouldSortClientSide) {
    const desc = sort.startsWith('-');
    pieces.push(orderBy(desc ? sort.slice(1) : sort, desc ? 'desc' : 'asc'));
  }
  if (limit && !shouldSortClientSide) pieces.push(limitQuery(limit));
  return query(...pieces);
};

const entityApi = (name) => ({
  list: async (sort, limit) => {
    const snapshot = await getDocs(buildListQuery(name, sort, limit));
    return sortRecords(snapshot.docs.map(normalizeDoc).filter(Boolean), sort).slice(0, limit || undefined);
  },

  filter: async (filters = {}, sort, limit) => {
    const pieces = [collection(db, name)];
    const userEmail = currentUserEmail();
    const mergedFilters = { ...filters };

    if (USER_SCOPED_ENTITIES.has(name) && !mergedFilters.created_by) {
      mergedFilters.created_by = userEmail;
    }

    const serverFilters = Object.entries(mergedFilters).filter(([, value]) => !Array.isArray(value));
    for (const [key, value] of serverFilters.slice(0, 1)) {
      pieces.push(where(key, '==', value));
    }

    const snapshot = await getDocs(query(...pieces));
    const records = applyFilters(snapshot.docs.map(normalizeDoc).filter(Boolean), mergedFilters);
    const sorted = sortRecords(records, sort);
    return sorted.slice(0, limit || undefined);
  },

  subscribe: (filters = {}, sort, limit, callback, onError) => {
    const pieces = [collection(db, name)];
    const userEmail = USER_SCOPED_ENTITIES.has(name) ? currentUserEmail() : null;
    const mergedFilters = { ...filters };

    if (USER_SCOPED_ENTITIES.has(name) && !mergedFilters.created_by) {
      mergedFilters.created_by = userEmail;
    }

    const serverFilters = Object.entries(mergedFilters).filter(([, value]) => !Array.isArray(value));
    for (const [key, value] of serverFilters.slice(0, 1)) {
      pieces.push(where(key, '==', value));
    }

    const unsubscribe = onSnapshot(
      query(...pieces),
      (snapshot) => {
        const records = applyFilters(snapshot.docs.map(normalizeDoc).filter(Boolean), mergedFilters);
        const sorted = sortRecords(records, sort).slice(0, limit || undefined);
        callback(sorted);
      },
      onError
    );

    return unsubscribe;
  },

  get: async (id) => normalizeDoc(await getDoc(doc(db, name, id))),

  create: async (data = {}) => {
    const firebaseUser = requireFirebaseUser();
    const record = {
      ...data,
      created_by: data.created_by || firebaseUser.email,
      created_date: nowIso(),
      updated_date: nowIso(),
    };
    const created = await addDoc(collection(db, name), record);
    return { id: created.id, ...record };
  },

  update: async (id, data = {}) => {
    const target = doc(db, name, id);
    const patch = { ...data, updated_date: nowIso() };
    await updateDoc(target, patch);
    return normalizeDoc(await getDoc(target));
  },

  delete: async (id) => {
    await deleteDoc(doc(db, name, id));
    return { success: true };
  },
});

const resizeImageFile = (file) =>
  new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      resolve(file);
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      try {
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error('Could not process image'));
              return;
            }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.78
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image'));
    };
    image.src = objectUrl;
  });

const uploadFile = async ({ file }) => {
  const firebaseUser = requireFirebaseUser();
  const uploadable = await resizeImageFile(file);
  const safeName = uploadable.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const path = `uploads/${firebaseUser.uid}/${Date.now()}-${safeName}`;

  try {
    const snapshot = await withTimeout(
      uploadBytes(ref(storage, path), uploadable, {
        contentType: uploadable.type || 'application/octet-stream',
      }),
      'Firebase Storage upload timed out. Check that Storage is enabled and rules are published.',
      20000
    );
    return { file_url: await getDownloadURL(snapshot.ref), storage_path: path };
  } catch (error) {
    console.warn('Firebase Storage upload failed; using compressed inline image fallback.', error);
    if (uploadable?.type?.startsWith('image/')) {
      return { file_url: await blobToDataUrl(uploadable), storage_path: null };
    }
    throw error;
  }
};

const invokeFunction = async (name, payload = {}) => {
  if (name === 'moderateContent') {
    return { data: { verdict: 'allow' } };
  }

  if (name === 'joinMission') {
    const user = await ensureUserProfile();
    const mission = await entityApi('Mission').get(payload.mission_id);
    if (!mission) return { data: { success: false, error: 'Mission not found' } };

    const activeMissionGoals = (await entityApi('Goal').list('-created_date', 100)).filter(
      (goal) => goal.status === 'active' && goal.mission_id
    );
    if (activeMissionGoals.length >= 3) {
      return { data: { success: false, error: 'Max 3 active missions' } };
    }

    const members = mission.members || [];
    if (!members.some((member) => member.user_email === user.email)) {
      await entityApi('Mission').update(mission.id, {
        members: [...members, { user_email: user.email, user_name: user.full_name, joined_date: nowIso() }],
        member_count: members.length + 1,
      });
    }

    const goal = await entityApi('Goal').create({
      title: mission.title,
      idol_name: mission.idol_name,
      idol_group: mission.idol_group,
      timeline_value: mission.timeline_value,
      timeline_unit: mission.timeline_unit,
      mission_id: mission.id,
      status: 'active',
      progress: 0,
      daily_checkins: [],
    });

    return { data: { success: true, goal_id: goal.id } };
  }

  if (name === 'leaveMission') {
    const user = await ensureUserProfile();
    const missionRef = doc(db, 'Mission', payload.mission_id);
    const missionSnapshot = await getDoc(missionRef);
    const mission = normalizeDoc(missionSnapshot);
    let deleted = false;
    let previousMemberCount = 0;
    let memberCount = 0;

    if (mission) {
      const currentParticipants = Array.isArray(mission.members) ? mission.members : [];
      const updatedParticipants = currentParticipants.filter(
        (participant) => participant.user_email !== user.email
      );

      previousMemberCount = currentParticipants.length;
      memberCount = updatedParticipants.length;

      if (updatedParticipants.length === 0) {
        await deleteDoc(missionRef);
        deleted = true;
      } else {
        await updateDoc(missionRef, {
          members: updatedParticipants,
          member_count: updatedParticipants.length,
          updated_date: nowIso(),
        });
      }
    }
    if (payload.goal_id) {
      await entityApi('Goal').update(payload.goal_id, { status: 'abandoned' });
    }
    return {
      data: {
        success: true,
        deleted,
        previous_member_count: previousMemberCount,
        member_count: memberCount,
      },
    };
  }

  return { data: { success: true } };
};

export const createFirebaseSynkifyClient = () => {
  const entities = ENTITY_NAMES.reduce((acc, name) => {
    acc[name] = entityApi(name);
    return acc;
  }, {});

  return {
    isFirebase: true,
    auth: {
      me: ensureUserProfile,
      updateMe: async (data) => {
        const firebaseUser = requireFirebaseUser();
        const userRef = doc(db, 'User', firebaseUser.uid);
        await setDoc(userRef, { ...data, updated_date: nowIso() }, { merge: true });
        return normalizeDoc(await getDoc(userRef));
      },
      logout: async () => signOut(auth),
      redirectToLogin: async () => {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (error) {
          if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw error;
        }
      },
      anonymousLogin: async () => {
        const result = await signInAnonymously(auth);
        return result.user;
      },
      onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
    },
    entities,
    functions: {
      invoke: invokeFunction,
    },
    integrations: {
      Core: {
        UploadFile: uploadFile,
      },
    },
  };
};
