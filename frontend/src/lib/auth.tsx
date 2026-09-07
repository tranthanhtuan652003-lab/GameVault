"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { LoginResponse, UserDto } from "./types";
import { api } from "./api";

const TOKEN_KEY = "gamevault_token";
const USER_KEY = "gamevault_user";

const storageListeners = new Set<() => void>();

function subscribe(callback: () => void) {
  const handle = (e: StorageEvent) => {
    if (e.key === null || e.key === TOKEN_KEY || e.key === USER_KEY) {
      storageListeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", handle);
  storageListeners.add(callback);
  return () => {
    window.removeEventListener("storage", handle);
    storageListeners.delete(callback);
  };
}

function readToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

// useSyncExternalStore requires getSnapshot to return a cached reference whenever
// the underlying data is unchanged. JSON.parse creates a fresh object on every
// call, which would make React think the snapshot changed each render and trigger
// an infinite update loop. Cache the parsed result keyed by the raw stored string.
let cachedUserRaw: string | null = null;
let cachedUser: UserDto | null = null;
function readUser(): UserDto | null {
  const raw = localStorage.getItem(USER_KEY);
  if (raw === cachedUserRaw) return cachedUser;
  cachedUserRaw = raw;
  if (!raw) {
    cachedUser = null;
    return null;
  }
  try {
    cachedUser = JSON.parse(raw) as UserDto;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

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
  const token = useSyncExternalStore(subscribe, readToken, () => "") || null;
  const user = useSyncExternalStore(subscribe, readUser, () => null) || null;

  const setUser = useCallback((u: UserDto) => {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    storageListeners.forEach((l) => l());
  }, []);

  const persistSession = useCallback((res: LoginResponse) => {
    localStorage.setItem(TOKEN_KEY, res.token);
    const u: UserDto = {
      id: res.id,
      userName: res.userName,
      email: res.email,
      fullName: res.fullName,
      avatarUrl: res.avatarUrl,
      role: res.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    storageListeners.forEach((l) => l());
    return u;
  }, []);

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
    storageListeners.forEach((l) => l());
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const u = await api.auth.me(token);
      setUser(u);
    } catch (err) {
      // Nếu gặp lỗi mất kết nối máy chủ backend (status 0), không đăng xuất user
      if (err && typeof err === "object" && "status" in err && err.status === 0) {
        return;
      }
      // token invalid/expired (status 401)
      logout();
    }
  }, [token, setUser, logout]);

  // Xử lý tập trung: bất kỳ request nào nhận 401 khi đã đăng nhập
  // (token hết hạn, user bị khóa...) đều tự động đăng xuất.
  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener("gamevault:unauthorized", onUnauthorized);
    return () => window.removeEventListener("gamevault:unauthorized", onUnauthorized);
  }, [logout]);

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
