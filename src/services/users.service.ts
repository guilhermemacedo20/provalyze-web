import { apiRequest } from "./api";

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export const authService = {
  login(data: { user: string; password: string }) {
    return apiRequest<User>("/auth/login", { method: "POST", body: data });
  },
  register(data: { name: string; email: string }) {
    return apiRequest<User>("/auth/register", { method: "POST", body: data });
  },
};
