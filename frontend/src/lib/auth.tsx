"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LoginResponse, UserDto } from "./types";
import { api } from "./api";

const TOKEN_KEY = "gamevault_token";
const USER_KEY = "gamevault_user";

interface AuthContextValue {
  token: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (userName: string, password: string) => Promise<UserDto>;
  register: (data: {
    userName: string;
    email: string;
    password: string;
    fullName: string;
  }) => Promise<UserDto>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: UserDto) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<UserDto | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) setToken(t);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    setHydrated(true);
  }, []);

  const setUser = useCallback((u: UserDto) => {
    setUserState(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  const persistSession = useCallback(
    (res: LoginResponse) => {
      const t = res.token;
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      const u: UserDto = {
        id: res.id,
        userName: res.userName,
        email: res.email,
        fullName: res.fullName,
        role: res.role,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setUser(u);
      return u;
    },
    [setUser]
  );

  const login = useCallback(
    async (userName: string, password: string) => {
      const res = await api.auth.login(userName, password);
      return persistSession(res);
    },
    [persistSession]
  );

  const register = useCallback(
    async (data: {
      userName: string;
      email: string;
      password: string;
      fullName: string;
    }) => {
      const res = await api.auth.register(data);
      return persistSession(res);
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUserState(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const u = await api.auth.me(token);
      setUser(u);
    } catch {
      // token invalid/expired
      logout();
    }
  }, [token, setUser, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: !!token && !!user,
      isAdmin: !!user && user.role === "Admin",
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [token, user, login, register, logout, refreshUser, setUser]
  );

  if (!hydrated) {
    return <div className="min-h-screen bg-canvas" />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
