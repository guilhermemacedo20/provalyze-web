import type { Role } from "@/lib/role";
import { User } from "@/services/users.service";

const TOKEN_KEY = "accessToken";
const USER_KEY = "user";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const storedUser = window.localStorage.getItem(USER_KEY);
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
}

export function saveSession(accessToken: string, user: User) {
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getCurrentRole(): Role {
  const stored = getStoredUser();
  if (stored) return stored.role;
  return "STUDENT";
}