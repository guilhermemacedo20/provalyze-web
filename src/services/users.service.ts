import { Role } from "@/lib/role";
import { apiRequest } from "./api";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  registrationNumber?: string;
  classes: string[];
  createdAt: string;
};

export const usersService = {
  // busca todos os usuários.
  listUsers() {
    return apiRequest<User[]>("/users");
  },
  createUser(data: { name: string; email: string; role: Role }) {
    return apiRequest<User>("/users", { method: "POST", body: data });
  },
  updateUser(id: string, data: { name: string; email: string; role: Role }) {
    return apiRequest<User>(`/users/${id}`, { method: "PATCH", body: data });
  },
  deleteUser(id: string) {
    return apiRequest<void>(`/users/${id}`, { method: "DELETE" });
  },
};
