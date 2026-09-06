import { apiRequest } from "./api";

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export const authService = { // agrupa todas as funções dentro de um único objeto.
  login(data: { user: string; password: string }) {
    return apiRequest<User>("/auth/login", { method: "POST", body: data });
  },
  // cadastro de um novo usuário.
  register(data: { name: string; email: string }) {
    return apiRequest<User>("/auth/register", { method: "POST", body: data });
  },
  // busca os dados do usuário logado.
  getProfile() {
    return apiRequest<User>("/auth/me");
  },
  // altera a senha do usuário logado.
  changePassword(data: { newPassword: string }) {
    return apiRequest<void>("/auth/change-password", { method: "POST", body: data });
  },
  // deleta a conta do usuário logado.
  deleteAccount() {
    return apiRequest<void>("/auth/me", { method: "DELETE" });
  },
};
