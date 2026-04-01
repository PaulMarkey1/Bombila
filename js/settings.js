// === STORAGE KEYS ===
export const STORAGE = {
  SHIFTS: 'yabombila_shifts',
  ACTIVE: 'yabombila_active_shift',
  LAST: 'yabombila_last_shift'
};

// === DEFAULT SHIFT ===
export const DEFAULT_SHIFT = {
  pausedDuration: 0,
  distance: 0,
  orders: 0,
  revenue: 0,
  expenses: 0,
  bonuses: 0
};

// === STORAGE HELPERS ===
export function getStorage(key, fallback = null) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorage(key) {
  localStorage.removeItem(key);
}

// === UTILS ===
export function toPositiveNumber(value) {
  const num = Number(value);
  return isNaN(num) || num < 0 ? 0 : num;
}

export function calculateProfit({ revenue = 0, expenses = 0, bonuses = 0 }) {
  return revenue + bonuses - expenses;
}

export function generateId() {
  return Date.now() + Math.random();
}