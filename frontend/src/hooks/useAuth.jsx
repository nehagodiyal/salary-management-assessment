import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import authService from '@/services/authService';
import tokenStore from '@/api/tokenStore';
import { setUnauthorizedHandler } from '@/api/httpClient';
import { ROLES } from '@/config/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => tokenStore.getUser());
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(
    (redirect = true) => {
      tokenStore.clear();
      setUser(null);
      if (redirect) navigate('/login', { replace: true });
    },
    [navigate],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => logout(true));
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      const token = tokenStore.getAccessToken();
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const me = await authService.me();
        if (!cancelled) {
          setUser(me);
          tokenStore.setUser(me);
        }
      } catch {
        if (!cancelled) {
          tokenStore.clear();
          setUser(null);
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const tokens = await authService.login({ email, password });
    tokenStore.setTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    });
    const me = await authService.me();
    if (me.role !== ROLES.ADMIN) {
      // This console is admin-only. Clear any tokens we just minted.
      tokenStore.clear();
      setUser(null);
      const err = new Error('Only administrators can sign in to this console.');
      err.code = 'NOT_ADMIN';
      throw err;
    }
    tokenStore.setUser(me);
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === ROLES.ADMIN,
      initializing,
      login,
      logout,
    }),
    [user, initializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default useAuth;
