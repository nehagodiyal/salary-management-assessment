import {
  TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from '@/config/constants';

const safeStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const tokenStore = {
  getAccessToken() {
    return safeStorage()?.getItem(TOKEN_STORAGE_KEY) ?? null;
  },
  getRefreshToken() {
    return safeStorage()?.getItem(REFRESH_TOKEN_STORAGE_KEY) ?? null;
  },
  setTokens({ accessToken, refreshToken }) {
    const s = safeStorage();
    if (!s) return;
    if (accessToken) s.setItem(TOKEN_STORAGE_KEY, accessToken);
    if (refreshToken) s.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  },
  getUser() {
    const raw = safeStorage()?.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user) {
    const s = safeStorage();
    if (!s) return;
    if (user) s.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else s.removeItem(USER_STORAGE_KEY);
  },
  clear() {
    const s = safeStorage();
    if (!s) return;
    s.removeItem(TOKEN_STORAGE_KEY);
    s.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    s.removeItem(USER_STORAGE_KEY);
  },
};

export default tokenStore;
