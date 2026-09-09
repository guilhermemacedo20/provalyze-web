export type Role = "ADMIN" | "TEACHER" | "STUDENT";

const TOKEN_KEY = "accessToken";
const USER_KEY = "user";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  registrationNumber?: string | null;
};

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  const storedUser = window.localStorage.getItem(USER_KEY);
  if (!storedUser) {
    return null;
  }
  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(accessToken: string, user: AuthUser) {
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") {
    return null;
  }
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getCurrentRole(): Role {
  const stored = getStoredUser();
  if (stored) {
    return stored.role;
  }
  return "STUDENT";
}
