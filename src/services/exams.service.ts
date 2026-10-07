import { apiRequest } from "./api";
import type { QuestionType } from "./questions.service";

export type ExamStatus = "DRAFT" | "PUBLISHED" | "ENDED";

export type ExamClass = {
  id: string;
  name: string;
  subjectName: string;
  courseName: string;
};

export type ExamClassDetail = ExamClass & { studentsCount: number };

export type ExamListItem = {
  id: string;
  title: string;
  status: ExamStatus;
  startsAt: string;
  endsAt: string;
  durationMinutes: number | null;
  questionsCount: number;
  totalPoints: number;
  classes: ExamClass[];
};

export type ExamQuestionDetail = {
  examQuestionId: string;
  questionId: string;
  order: number;
  points: number;
  statement: string;
  type: QuestionType | null;
  themeId: string;
  themeName: string;
  correctRate: number | null;
};

export type ExamDetail = {
  id: string;
  title: string;
  status: ExamStatus;
  startsAt: string;
  endsAt: string;
  durationMinutes: number | null;
  targetScore: number;
  teacherName: string;
  classes: ExamClassDetail[];
  studentsCount: number;
  questions: ExamQuestionDetail[];
  totalPoints: number;
};

export type StudentExamStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "FINISHED"
  | "GRADED"
  | "EXPIRED";

export type ExamOverview = {
  stats: {
    questionsCount: number;
    studentsCount: number;
    average: number | null;
    completionRate: number;
  };
  students: {
    id: string;
    name: string;
    status: StudentExamStatus;
    score: number | null;
    durationMinutes: number | null;
  }[];
};

export type SaveExamPayload = {
  title: string;
  startsAt: string;
  endsAt: string; 
  durationMinutes: number;
  totalScore: number;
  questions: { questionId: string; points: number }[];
  classIds: string[];
  publish?: boolean;
};

export const examsService = {
  listExams() {
    return apiRequest<ExamListItem[]>("/exams");
  },

  getExam(id: string) {
    return apiRequest<ExamDetail>(`/exams/${id}`);
  },

  getOverview(id: string) {
    return apiRequest<ExamOverview>(`/exams/${id}/overview`);
  },

  createExam(data: SaveExamPayload) {
    return apiRequest<ExamDetail>("/exams", { method: "POST", body: data });
  },

  updateExam(id: string, data: SaveExamPayload) {
    return apiRequest<ExamDetail>(`/exams/${id}`, {
      method: "PATCH",
      body: data,
    });
  },

  publishExam(id: string) {
    return apiRequest<ExamDetail>(`/exams/${id}/publish`, { method: "POST" });
  },

  deleteExam(id: string) {
    return apiRequest<{ id: string }>(`/exams/${id}`, { method: "DELETE" });
  },
};