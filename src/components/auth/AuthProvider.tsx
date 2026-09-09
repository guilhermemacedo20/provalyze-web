"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AuthUser,
  clearSession,
  getAccessToken,
  getStoredUser,
  saveSession,
} from "@/lib/auth-role-storage";
import { authService } from "@/services/auth.service";

type AuthContextValue = {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const userStored = getStoredUser();

    if (!token) {
      clearSession();
      return;
    }

    if (userStored) {
      setUser(userStored);
    }

    authService
      .me()
      .then((user) => {
        setUser(user);
        saveSession(token, user);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      async login(email, password) {
        const session = await authService.login(email, password);
        saveSession(session.accessToken, session.user);
        setUser(session.user);
        return session.user;
      },
      logout() {
        clearSession();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa estar dentro de AuthProvider");
  }
  return context;
}
