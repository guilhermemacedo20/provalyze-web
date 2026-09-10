import { apiRequest } from "./api";
import type { Theme } from "./themes.service";

export type QuestionType = "MULTIPLE_CHOICE" | "OPEN_ENDED";

export type QuestionOption = {
  label: string;
  text: string;
  isCorrect: boolean;
};

export type QuestionPayload = {
  statement: string;
  type: QuestionType;
  themeId: string;
  correctOption?: string;
  options?: QuestionOption[];
};

export type Question = QuestionPayload & {
  id?: string;
  theme?: Theme;
  questionOptions?: QuestionOption[];
};

export const questionsService = {
  createQuestion(data: QuestionPayload) {
    return apiRequest("/questions", { method: "POST", body: data });
  },

  listQuestions(themeId?: string): Promise<Question[]> {
    const query = themeId ? `?themeId=${encodeURIComponent(themeId)}` : "";
    return apiRequest(`/questions${query}`);
  },

  getQuestion(id: string): Promise<Question> {
    return apiRequest(`/questions/${id}`);
  },

  updateQuestion(id: string, data: QuestionPayload) {
    return apiRequest(`/questions/${id}`, { method: "PATCH", body: data });
  },

  deleteQuestion(id: string) {
    return apiRequest(`/questions/${id}`, { method: "DELETE" });
  },
};
