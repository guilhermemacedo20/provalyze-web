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
};