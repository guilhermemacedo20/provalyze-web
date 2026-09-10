import { apiRequest } from "./api";

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  classes: string[]; // nomes das turmas, ex: ["1º A", "7º A"]
  createdAt: string; // formato "DD/MM/AAAA"
};

export const usersService = {
  // busca todos os usuários.
  listUsers() {
    return apiRequest<User[]>("/users");
  },
    createUser(data: { name: string; email: string; role: UserRole }) {
    return apiRequest<User>("/users", { method: "POST", body: data });
  },
    updateUser(id: string, data: { name: string; email: string; role: UserRole }) {
    return apiRequest<User>(`/users/${id}`, { method: "PATCH", body: data });
  },
    deleteUser(id: string) {
    return apiRequest<void>(`/users/${id}`, { method: "DELETE" });
  },
};