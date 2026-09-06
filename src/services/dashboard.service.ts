import { apiRequest } from "./api";

// todos são calculados do back-end, o front-end só faz a exibição.
export type AdminStats = {
  totalUsers: number;
  teachers: number;
  students: number;
  classes: number;
  examsCreated: number;
  examsTaken: number;
  schoolAverage: number | null;
};

export const dashboardService = {
    // busca os números do painel administrativo.
  getAdminStats() {
    return apiRequest<AdminStats>("/dashboard/admin");
  },
};