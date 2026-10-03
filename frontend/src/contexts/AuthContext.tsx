import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { api } from '../api/client';
import {
  clearTokens,
  getAccessToken,
  saveTokens,
} from '../services/auth-storage';
import { login as loginRequest } from '../services/auth.service';

import type {
  JwtPayload,
  LoginCredentials,
} from '../types/auth';

interface AuthContextData {
  user: JwtPayload | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (
    credentials: LoginCredentials,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<
  AuthContextData | undefined
>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<JwtPayload | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const accessToken = getAccessToken();

      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response =
          await api.get<JwtPayload>('/auth/me');

        setUser(response.data);
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
  }, []);

  useEffect(() => {
    function handleSessionExpired() {
      clearTokens();
      setUser(null);
    }

    window.addEventListener(
      'auth:session-expired',
      handleSessionExpired,
    );

    return () => {
      window.removeEventListener(
        'auth:session-expired',
        handleSessionExpired,
      );
    };
  }, []);

  async function login(
    credentials: LoginCredentials,
  ): Promise<void> {
    const tokens = await loginRequest(credentials);

    saveTokens(
      tokens.accessToken,
      tokens.refreshToken,
    );

    const response =
      await api.get<JwtPayload>('/auth/me');

    setUser(response.data);
  }

  async function logout(): Promise<void> {
    try {
      if (getAccessToken()) {
        await api.delete('/auth/logout');
      }
    } finally {
      clearTokens();
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}