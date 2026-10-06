import type { QuestionType } from "@/services/questions.service";

export const EXAM_TOTAL_SCORE = 10;

export type SelectedQuestion = {
  questionId: string;
  points: number;
  statement: string;
  themeId: string;
  themeName: string;
  type: QuestionType | null;
};

export function sumPoints(questions: SelectedQuestion[]) {
  return questions.reduce((sum, q) => sum + q.points, 0);
}

export function typeLabel(type: QuestionType | null) {
  if (type === "OPEN_ENDED") return "Dissertativa";
  if (type === "MULTIPLE_CHOICE") return "Objetiva";
  return "—";
}

// aceita "2", "2,5" e "2.5"; devolve null se não for um valor válido (> 0)
export function parsePoints(raw: string): number | null {
  const value = Number(raw.trim().replace(",", "."));
  if (!Number.isFinite(value) || value <= 0 || value > 1000) return null;
  return Math.round(value * 100) / 100;
}