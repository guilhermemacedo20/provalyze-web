import { apiRequest } from "./api";

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
  | "CONTEXT_MENU"
  | "QUESTION_CHANGE";

export type SubmitExamResult = {
  status: string;
  score: number;
  finishedAt: string;
  questions: ExamReviewQuestion[];
};

export const examsService = {
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
    return apiRequest<SubmitExamResult>(
      `/classes-exams/${classId}/exams/${examId}/examEvents`,
      { method: "POST", body: { event } },
    );
  },
};
