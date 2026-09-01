import { apiRequest } from "./api";

export type QuestionType = "MULTIPLE_CHOICE" | "OPEN_ENDED";

export type QuestionOption = {
  label: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id?: string;
  statement: string;
  type: QuestionType;
  theme: string;
  correctOption?: string;
  options?: QuestionOption[];
  questionOptions?: QuestionOption[];
};

export const questionsService = {

  createQuestion(data: Question) {
    return apiRequest("/questions", { method: "POST", body: data });
  },

  listQuestions(): Promise<Question[]> {
    return apiRequest("/questions");
  },

  getQuestion(id: string): Promise<Question> {
    return apiRequest(`/questions/${id}`);
  },

  updateQuestion(id: string, data: Question) {
    return apiRequest(`/questions/${id}`, { method: "PATCH", body: data });
  },

  deleteQuestion(id: string) {
    return apiRequest(`/questions/${id}`, { method: "DELETE" });
  },

};
