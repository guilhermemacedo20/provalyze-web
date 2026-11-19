import { clearSession, getAccessToken } from "@/lib/auth-role-storage";

export const TERMS_REQUIRED_EVENT = "terms-required";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && token) {
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 403 && typeof window !== "undefined") {
      let code: unknown = null;
      try {
        code = JSON.parse(text).code;
      } catch {
        code = null;
      }
      if (code === "TERMS_NOT_ACCEPTED") {
        window.dispatchEvent(new Event(TERMS_REQUIRED_EVENT));
      }
    }
    throw new Error(text);
  }

  return response.json() as Promise<T>;
}
