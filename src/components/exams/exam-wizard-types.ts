import type { QuestionType } from "@/services/questions.service";

export const EXAM_TOTAL_SCORE = 10;
export const MAX_TOTAL_SCORE = 1000;

export type SelectedQuestion = {
  questionId: string;
  points: number;
  statement: string;
  themeId: string;
  themeName: string;
  type: QuestionType | null;
};

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function sumPoints(questions: SelectedQuestion[]) {
  return round2(questions.reduce((sum, q) => sum + q.points, 0));
}

export function typeLabel(type: QuestionType | null) {
  if (type === "OPEN_ENDED") return "Dissertativa";
  if (type === "MULTIPLE_CHOICE") return "Objetiva";
  return "—";
}

export function parsePoints(raw: string): number | null {
  const value = Number(raw.trim().replace(",", "."));
  if (!Number.isFinite(value) || value <= 0 || value > MAX_TOTAL_SCORE) {
    return null;
  }
  return round2(value);
}