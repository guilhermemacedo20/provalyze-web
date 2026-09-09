import { apiRequest } from "./api";
import type { AuthUser } from "@/lib/auth-role-storage";

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export const authService = {

  // realiza o login do usuário
  login(email: string, password: string) {
    return apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },

  // cadastro de um novo usuário.
  register(data: { name: string; email: string }) {
    return apiRequest<User>("/auth/register", { method: "POST", body: data });
  },

  // altera a senha do usuário logado.
  changePassword(data: { newPassword: string }) {
    return apiRequest<void>("/auth/change-password", {
      method: "POST",
      body: data,
    });
  },

  // traz os dados do usuário logado
  me() {
    return apiRequest<AuthUser>("/auth/me");
  },
};
