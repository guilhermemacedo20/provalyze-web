import { apiRequest } from "./api";
import type { AuthUser } from "@/lib/auth-role-storage";

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export const authService = {
  login(email: string, password: string) {
    return apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },

  register(data: {
    name: string;
    email: string;
    role: "TEACHER" | "STUDENT";
    password: string;
  }) {
    return apiRequest<AuthUser>("/auth/register", {
      method: "POST",
      body: data,
    });
  },

  forgotPassword(email: string) {
    return apiRequest<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  },

  resetPassword(data: { email: string; code: string; newPassword: string }) {
    return apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: data,
    });
  },

  changePassword(data: {
    email: string;
    actualPassword: string;
    newPassword: string;
  }) {
    return apiRequest<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: data,
    });
  },

  me() {
    return apiRequest<AuthUser>("/auth/me");
  },
};