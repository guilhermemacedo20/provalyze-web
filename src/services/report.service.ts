import { apiRequest } from "./api";

export type AdminStats = {
  role: "ADMIN" | "COORDINATOR";
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalExams: number;
  completedExams: number;
  totalAverage: number | null;
};

export type TeacherStats = {
  role: "TEACHER";
  totalExams: number;
  totalAverage: number | null;
  hitRate: number | null;
};

export type StudentStats = {
  role: "STUDENT";
  upcomingExams: number;
  finishedExams: number;
  totalAverage: number | null;
};

export type DashboardStats = AdminStats | TeacherStats | StudentStats;

export const reportService = {
  getDashboard() {
    return apiRequest<DashboardStats>("/report/dashboard-information");
  },
};
