import { apiRequest } from "./api";

export type AiResponse = {
  suggestedScore: number;
  justification: string;
  maxScore: number;
};

export const aiService = {
  validateQuestion(answerId: string) {
    return apiRequest<AiResponse>(
      `/exams/${answerId}/aiValidateQuestion`,
    );
  },
};
