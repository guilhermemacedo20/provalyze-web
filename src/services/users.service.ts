import { apiRequest } from './api';

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export const usersService = {
  list() {
    return apiRequest<User[]>('/users');
  },
  create(data: { name: string; email: string }) {
    return apiRequest<User>('/users', { method: 'POST', body: data });
  },
};