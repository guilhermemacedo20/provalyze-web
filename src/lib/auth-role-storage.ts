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
  clearOtherExamDrafts(user.id);
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  clearExamDrafts();
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

const EXAM_DRAFT_PREFIX = "provalyze-exam-";

export function examDraftKey(userId: string, examId: string) {
  return `${EXAM_DRAFT_PREFIX}${userId}-${examId}`;
}

export function clearExamDrafts() {
  if (typeof window === "undefined") return;
  removeExamDrafts((key) => key.startsWith(EXAM_DRAFT_PREFIX));
}

export function clearOtherExamDrafts(userId: string) {
  if (typeof window === "undefined") return;
  const ownPrefix = examDraftKey(userId, "");
  removeExamDrafts(
    (key) => key.startsWith(EXAM_DRAFT_PREFIX) && !key.startsWith(ownPrefix),
  );
}

function removeExamDrafts(shouldRemove: (key: string) => boolean) {
  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index++) {
    const key = window.localStorage.key(index);
    if (key && shouldRemove(key)) keys.push(key);
  }
  for (const key of keys) window.localStorage.removeItem(key);
}
