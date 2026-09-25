import { apiRequest } from "./api";
import { User } from "./users.service";

export type LoginResponse = {
  accessToken: string;
  user: User;
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
    return apiRequest<User>("/auth/register", {
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

  deleteAccount() {
    return apiRequest<{ message: string }>("/user/delete", {
      method: "DELETE",
    });
  },

  me() {
    return apiRequest<User>("/auth/me");
  },
};
