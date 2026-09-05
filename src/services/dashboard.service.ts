import { apiRequest } from "./api";

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
  getAdminStats(): Promise<AdminStats> {
    return apiRequest<AdminStats>("/dashboard/admin");
  },
};