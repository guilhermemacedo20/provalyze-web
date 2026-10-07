import { apiRequest } from "./api";
import type { QuestionType } from "./questions.service";

export type StudentExam = {
  id: string;
  classId: string;
  className: string;
  subjectName: string;
  courseName: string;
  title: string;
  startsAt: string;
  endsAt: string;
  targetScore: number;
  durationMinutes: number | null;
  status: string;
  sessionStatus: string | null;
  score: number | null;
  available: boolean;
  finished: boolean;
  message: string | null;
};

export type StudentClassExams = {
  classId: string;
  className: string;
  subjectName: string;
  courseName: string;
  exams: StudentExam[];
};

export type ExamOption = {
  id: string;
  label: string;
  text: string;
};

export type ExamQuestion = {
  id: string;
  questionId: string;
  points: number;
  statement: string;
  type: "OPEN_ENDED" | "MULTIPLE_CHOICE" | null;
  themeName: string;
  imageUrl: string | null;
  options: ExamOption[];
};

export type ExamReviewQuestion = {
  examQuestionId: string;
  type: "OPEN_ENDED" | "MULTIPLE_CHOICE" | null;
  themeName: string;
  isCorrect: boolean;
  score: number;
  gradeStatus: string;
};

export type StudentExamDetail = {
  available: boolean;
  finished?: boolean;
  message?: string;
  startsAt: string;
  endsAt: string;
  id?: string;
  title?: string;
  score?: number | null;
  targetScore?: number;
  sessionId?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  expiresAt?: string;
  durationMinutes?: number | null;
  status?: string;
  questions?: ExamQuestion[];
  review?: ExamReviewQuestion[];
};

export type ExamEventType =
  | "PASTE"
  | "COPY"
  | "CUT"
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "CONTEXT_MENU";

export type SubmitExamResult = {
  status: string;
  score: number;
  finishedAt: string;
  questions: ExamReviewQuestion[];
};

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

  listClassExams(classId: string) {
    return apiRequest<StudentClassExams>(`/classes-exams/${classId}`);
  },

  getStudentExam(classId: string, examId: string) {
    return apiRequest<StudentExamDetail>(
      `/classes-exams/${classId}/exams/${examId}`,
    );
  },

  submitStudentExam(
    classId: string,
    examId: string,
    answers: { examQuestionId: string; optionId?: string; content?: string }[],
  ) {
    return apiRequest<SubmitExamResult>(
      `/classes-exams/${classId}/exams/${examId}/submit`,
      { method: "POST", body: { answers } },
    );
  },

  createExamEvent(
    classId: string,
    examId: string,
    event: { type: ExamEventType; examQuestionId: string },
  ) {
    return apiRequest<{ id: string; type: ExamEventType }>(
      `/classes-exams/${classId}/exams/${examId}/examEvents`,
      { method: "POST", body: { event } },
    );
  },
};
