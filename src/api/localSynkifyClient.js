const STORAGE_KEY = 'synkify_local_cache';

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

const nowIso = () => new Date().toISOString();

const makeId = (prefix = 'rec') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

const defaultUser = () => ({
  id: 'local_user',
  email: 'local@synkify.app',
  full_name: 'Local Fan',
  role: 'admin',
  onboarded: true,
  favorite_idol: 'Winter',
  favorite_group: 'aespa',
  nickname: 'Local Fan',
  profile_visibility: 'public',
  followers: [],
  following: [],
  created_by: 'local@synkify.app',
  created_date: nowIso(),
  updated_date: nowIso(),
});

const emptyCollections = () =>
  ENTITY_NAMES.reduce((acc, name) => {
    acc[name] = [];
    return acc;
  }, {});

const loadState = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (parsed?.collections && parsed?.currentUser) return parsed;
  } catch {}

  const user = defaultUser();
  const collections = emptyCollections();
  collections.User = [user];
  const state = { currentUser: user, collections };
  saveState(state);
  return state;
};

const saveState = (state) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const clone = (value) => JSON.parse(JSON.stringify(value));

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

const matchesFilter = (record, filters = {}) =>
  Object.entries(filters).every(([key, value]) => {
    if (value === undefined) return true;
    if (Array.isArray(value)) return value.includes(record[key]);
    return record[key] === value;
  });

const withState = (mutator) => {
  const state = loadState();
  const result = mutator(state);
  saveState(state);
  return clone(result);
};

const entityApi = (name) => ({
  list: async (sort, limit) =>
    withState((state) => sortRecords(state.collections[name] || [], sort).slice(0, limit || undefined)),

  filter: async (filters = {}, sort, limit) =>
    withState((state) =>
      sortRecords((state.collections[name] || []).filter((record) => matchesFilter(record, filters)), sort).slice(
        0,
        limit || undefined
      )
    ),

  get: async (id) =>
    withState((state) => (state.collections[name] || []).find((record) => record.id === id) || null),

  create: async (data) =>
    withState((state) => {
      const currentUser = state.currentUser;
      const record = {
        id: makeId(name.toLowerCase()),
        ...data,
        created_by: data.created_by || currentUser.email,
        created_date: nowIso(),
        updated_date: nowIso(),
      };
      state.collections[name] = [record, ...(state.collections[name] || [])];
      return record;
    }),

  update: async (id, data) =>
    withState((state) => {
      const records = state.collections[name] || [];
      const index = records.findIndex((record) => record.id === id);
      if (index === -1) throw new Error(`${name} record not found: ${id}`);
      records[index] = { ...records[index], ...data, updated_date: nowIso() };
      if (name === 'User' && state.currentUser.id === id) {
        state.currentUser = records[index];
      }
      return records[index];
    }),

  delete: async (id) =>
    withState((state) => {
      const records = state.collections[name] || [];
      state.collections[name] = records.filter((record) => record.id !== id);
      return { success: true };
    }),
});

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(blob);
  });

const imageToCompressedDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      try {
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
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

const fileToDataUrl = async (file) => {
  if (file?.type?.startsWith('image/')) {
    return imageToCompressedDataUrl(file);
  }
  return blobToDataUrl(file);
};

const invokeFunction = async (name, payload = {}) => {
  if (name === 'moderateContent') {
    return { data: { verdict: 'allow' } };
  }

  if (name === 'joinMission') {
    const state = loadState();
    const mission = state.collections.Mission.find((item) => item.id === payload.mission_id);
    if (!mission) return { data: { success: false, error: 'Mission not found' } };

    const currentUser = state.currentUser;
    const activeMissionGoals = state.collections.Goal.filter(
      (goal) => goal.created_by === currentUser.email && goal.status === 'active' && goal.mission_id
    );
    if (activeMissionGoals.length >= 3) {
      return { data: { success: false, error: 'Max 3 active missions' } };
    }

    const alreadyMember = (mission.members || []).some((member) => member.user_email === currentUser.email);
    if (!alreadyMember) {
      mission.members = [
        ...(mission.members || []),
        { user_email: currentUser.email, user_name: currentUser.full_name, joined_date: nowIso() },
      ];
      mission.member_count = mission.members.length;
    }

    state.collections.Goal.unshift({
      id: makeId('goal'),
      title: mission.title,
      idol_name: mission.idol_name,
      idol_group: mission.idol_group,
      timeline_value: mission.timeline_value,
      timeline_unit: mission.timeline_unit,
      mission_id: mission.id,
      status: 'active',
      progress: 0,
      daily_checkins: [],
      created_by: currentUser.email,
      created_date: nowIso(),
      updated_date: nowIso(),
    });

    saveState(state);
    return { data: { success: true } };
  }

  if (name === 'leaveMission') {
    const state = loadState();
    const currentUser = state.currentUser;
    const mission = state.collections.Mission.find((item) => item.id === payload.mission_id);
    if (mission) {
      mission.members = (mission.members || []).filter(
        (member) => member.user_email?.toLowerCase() !== currentUser.email?.toLowerCase()
      );
      mission.member_count = mission.members.length;
      if (mission.creator_email === currentUser.email || mission.members.length === 0) {
        mission.status = 'closed';
      }
      mission.updated_date = nowIso();
    }
    state.collections.Goal = state.collections.Goal.map((goal) =>
      goal.created_by === currentUser.email &&
      goal.status === 'active' &&
      goal.mission_id === payload.mission_id &&
      (!payload.goal_id || goal.id === payload.goal_id)
        ? { ...goal, status: 'abandoned', updated_date: nowIso() }
        : goal
    );
    saveState(state);
    return { data: { success: true } };
  }

  return { data: { success: true } };
};

export const createLocalSynkifyClient = () => {
  const entities = ENTITY_NAMES.reduce((acc, name) => {
    acc[name] = entityApi(name);
    return acc;
  }, {});

  return {
    isLocal: true,
    auth: {
      me: async () => withState((state) => state.currentUser),
      updateMe: async (data) =>
        withState((state) => {
          const updated = { ...state.currentUser, ...data, updated_date: nowIso() };
          state.currentUser = updated;
          state.collections.User = (state.collections.User || []).map((user) =>
            user.id === updated.id ? updated : user
          );
          return updated;
        }),
      logout: () => {},
      redirectToLogin: () => {},
    },
    entities,
    functions: {
      invoke: invokeFunction,
    },
    integrations: {
      Core: {
        UploadFile: async ({ file }) => ({ file_url: await fileToDataUrl(file) }),
      },
    },
  };
};
