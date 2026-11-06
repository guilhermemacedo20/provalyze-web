import { downloadPedagogicalReportPdf } from "@/utils/pedagogical-report-pdf";
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

export type DashboardStats = (AdminStats | TeacherStats | StudentStats) &
  DashboardCharts;

export type DashboardPeriod = "semester" | "year" | "all";

export type DashboardFilter = {
  period: DashboardPeriod;
  semester?: string;
  year?: string;
  classId?: string;
  subjectId?: string;
};

type AnswerOutcomes = { correct: number; wrong: number; pending: number };

export type DashboardCharts = {
  hitRate?: number | null;
  classes: {
    id: string;
    name: string;
    subjectId: string;
    subjectName: string;
  }[];
  pendingSubmissions: number;
  answers: AnswerOutcomes;
  scoresByExam: { examId: string; title: string; average: number }[];
  questionsByExam: {
    examId: string;
    title: string;
    answers: AnswerOutcomes;
    questions: (AnswerOutcomes & { number: number; theme: string })[];
  }[];
  timeline: { label: string; submissions: number }[];
};

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

export type StudentAnswerOutcomes = { correct: number; wrong: number };

export type StudentAnalytics = {
  studentName: string;
  className: string;
  subjectName: string;
  totalAverage: number | null;
  finishedExams: number;
  themes: StudentThemeResult[];
  answers: {
    objective: StudentAnswerOutcomes;
    essay: StudentAnswerOutcomes;
  };
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

export type ReportAnalysisType = "PERFORMANCE" | "GAPS" | "BOTH";

export type PedagogicalReportSummary = {
  id: string;
  title: string;
  className: string;
  createdAt: string;
  authorName: string;
  analysisType: ReportAnalysisType;
};

export type PedagogicalReportContent = {
  average: number | null;
  median: number | null;
  hitRate: number | null;
  themes: { name: string; percent: number }[];
  students: {
    name: string;
    exams: { title: string; score: number | null }[];
  }[];
  gaps: GapReport[];
};

export type PedagogicalReportDetail = PedagogicalReportSummary & {
  subjectName: string;
  content: PedagogicalReportContent;
};

const gapsInFlight = new Map<string, Promise<GapReport[]>>();

export const reportService = {
  getDashboard(filter?: DashboardFilter) {
    const params = new URLSearchParams();
    if (filter) {
      params.set("period", filter.period);
      if (filter.period === "semester" && filter.semester)
        params.set("semester", filter.semester);
      if (filter.period === "year" && filter.year)
        params.set("year", filter.year);
      if (filter.classId) params.set("classId", filter.classId);
      if (filter.subjectId) params.set("subjectId", filter.subjectId);
    }
    const query = params.toString();
    return apiRequest<DashboardStats>(
      `/report/dashboard-information${query ? `?${query}` : ""}`,
    );
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

  listPedagogicalReports(classId?: string) {
    const params = new URLSearchParams();
    if (classId) {
      params.set("classId", classId);
    }
    return apiRequest<PedagogicalReportSummary[]>(
      `/report/pedagogical-reports?${params}`,
    );
  },

  createPedagogicalReport(body: {
    classId: string;
    analysisType: ReportAnalysisType;
  }) {
    return apiRequest<PedagogicalReportDetail>("/report/pedagogical-reports", {
      method: "POST",
      body,
    });
  },

  deletePedagogicalReport(id: string) {
    return apiRequest<PedagogicalReportDetail>(
      `/report/pedagogical-reports/${id}`,
      {
        method: "DELETE",
      },
    );
  },

  async downloadPedagogicalReport(id: string) {
    const report = await apiRequest<PedagogicalReportDetail>(
      `/report/pedagogical-reports/${id}`,
    );

    await downloadPedagogicalReportPdf(report);
  },
};
