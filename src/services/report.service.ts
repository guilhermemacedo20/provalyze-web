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

export type StudentThemeResult = {
  name: string;
  percent: number;
};

export type StudentExamHistory = {
  title: string;
  subjectName: string;
  finishedAt: string | null;
  score: number | null;
};

export type StudentAnalytics = {
  studentName: string;
  className: string;
  subjectName: string;
  totalAverage: number | null;
  finishedExams: number;
  themes: StudentThemeResult[];
  exams: StudentExamHistory[];
};

export type StudentThemeAnalysis = {
  difficulty: string;
  recommendation: string;
};

export type PerformanceTheme = {
  name: string;
  percent: number;
};

export type PerformanceReport = {
  average: number | null;
  median: number | null;
  hitRate: number | null;
  themes: PerformanceTheme[];
  classes: { id: string; name: string; subjectName: string }[];
  exams: { id: string; title: string; targetScore: string }[];
};

export type GapReport = {
  theme: string;
  evidence: string;
  suggestion: string;
  percent: number;
};

const gapsInFlight = new Map<string, Promise<GapReport[]>>();

export const reportService = {
  getDashboard() {
    return apiRequest<DashboardStats>("/report/dashboard-information");
  },

  getStudentAnalytics(classId: string, studentId: string) {
    return apiRequest<StudentAnalytics>(
      `/report/${classId}/analytics/${studentId}`,
    );
  },

  getStudentThemeAnalysis(classId: string, studentId: string) {
    return apiRequest<StudentThemeAnalysis>(
      `/report/${classId}/analytics/${studentId}/ai`,
    );
  },

  getGeneralAnalytics(classId?: string, examId?: string) {
    const params = new URLSearchParams();
    if (classId) {
      params.set("classId", classId);
    }
    if (examId) {
      params.set("examId", examId);
    }
    return apiRequest<PerformanceReport>(`/report/classAnalytics?${params}`);
  },

  getGaps(classId?: string) {
    const key = classId ?? "";
    const current = gapsInFlight.get(key);
    if (current) return current;

    const params = new URLSearchParams();
    if (classId) {
      params.set("classId", classId);
    }
    const request = apiRequest<GapReport[]>(`/report/gaps?${params}`).finally(
      () => {
        gapsInFlight.delete(key);
      },
    );
    gapsInFlight.set(key, request);
    return request;
  },
};
