import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USERS: '@tv_users',
  CURRENT_USER: '@tv_current_user',
  CATEGORIES: '@tv_categories',
  SEEDED: '@tv_seeded',
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ─── Storage helpers ─────────────────────────────────────────────────────────
async function getJSON(key, fallback = null) {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

async function setJSON(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const ADMIN_EMAIL = 'admin@admin.com';
export const ADMIN_PASSWORD = 'admin';

export const adminUser = {
  id: 'admin-001',
  displayName: 'Administrador',
  email: ADMIN_EMAIL,
  role: 'admin',
  score: 0,
  level: 'experto',
  questionsAnswered: 0,
  createdAt: '2024-01-01',
};

export async function registerUser(displayName, email, password) {
  if (email.toLowerCase() === ADMIN_EMAIL) {
    throw new Error('Este correo está reservado.');
  }
  const users = await getJSON(KEYS.USERS, []);
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Ya existe una cuenta con este correo.');
  }
  const newUser = {
    id: generateId(),
    displayName,
    email: email.toLowerCase(),
    passwordHash: simpleHash(password),
    role: 'player',
    score: 0,
    level: 'basico',
    questionsAnswered: 0,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await setJSON(KEYS.USERS, users);
  await setJSON(KEYS.CURRENT_USER, newUser);
  return newUser;
}

export async function loginUser(email, password) {
  // Admin bypass
  if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    await setJSON(KEYS.CURRENT_USER, adminUser);
    return adminUser;
  }
  const users = await getJSON(KEYS.USERS, []);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('No existe cuenta con este correo.');
  if (user.passwordHash !== simpleHash(password)) throw new Error('Contraseña incorrecta.');
  await setJSON(KEYS.CURRENT_USER, user);
  return user;
}

export async function logoutUser() {
  await AsyncStorage.removeItem(KEYS.CURRENT_USER);
}

export async function getCurrentUser() {
  return getJSON(KEYS.CURRENT_USER, null);
}

export async function updateUserScore(userId, score, level, questionsAnswered) {
  if (userId === 'admin-001') return;
  const users = await getJSON(KEYS.USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  users[idx] = { ...users[idx], score, level, questionsAnswered };
  await setJSON(KEYS.USERS, users);
  await setJSON(KEYS.CURRENT_USER, users[idx]);
  return users[idx];
}

export async function getAllUsers() {
  return getJSON(KEYS.USERS, []);
}

// ─── Categories ──────────────────────────────────────────────────────────────
export async function getCategories() {
  return getJSON(KEYS.CATEGORIES, []);
}

export async function saveCategory(category) {
  const cats = await getCategories();
  if (category.id) {
    const idx = cats.findIndex(c => c.id === category.id);
    if (idx !== -1) cats[idx] = category;
    else cats.push(category);
  } else {
    cats.push({ ...category, id: generateId() });
  }
  await setJSON(KEYS.CATEGORIES, cats);
  return cats;
}

export async function deleteCategory(id) {
  const cats = await getCategories();
  await setJSON(KEYS.CATEGORIES, cats.filter(c => c.id !== id));
}

export async function isSeeded() {
  return getJSON(KEYS.SEEDED, false);
}

export async function seedData(categories) {
  await setJSON(KEYS.CATEGORIES, categories);
  await setJSON(KEYS.SEEDED, true);
}
