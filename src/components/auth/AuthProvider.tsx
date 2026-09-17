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
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    const userStored = getStoredUser();

    if (!token) {
      clearSession();
      setLoading(false);
      return;
    }

    if (userStored) {
      setUser(userStored);
    }

    // Confirma com o servidor que o token ainda é válido e busca dados.
    authService
      .me()
      .then((freshUser) => {
        setUser(freshUser);
        saveSession(token, freshUser);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
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
    [user, loading],
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