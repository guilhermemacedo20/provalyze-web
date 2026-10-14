import type { QuestionType } from "@/services/questions.service";

export const EXAM_TOTAL_SCORE = 10;
export const MAX_TOTAL_SCORE = 1000;

export type SelectedQuestion = {
  questionId: string;
  points: number | null; 
  statement: string;
  themeId: string;
  themeName: string;
  type: QuestionType | null;
};

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function sumPoints(questions: SelectedQuestion[]) {
  return round2(questions.reduce((sum, q) => sum + (q.points ?? 0), 0));
}

export function typeLabel(type: QuestionType | null) {
  if (type === "OPEN_ENDED") return "Dissertativa";
  if (type === "MULTIPLE_CHOICE") return "Objetiva";
  return "—";
}

// aceita "2", "2,5" e "2.5"; devolve null se não for um valor válido (> 0)
export function parsePoints(raw: string): number | null {
  const value = Number(raw.trim().replace(",", "."));
  if (!Number.isFinite(value) || value <= 0 || value > MAX_TOTAL_SCORE) {
    return null;
  }
  return round2(value);
}

export function distributeEqually(
  questions: SelectedQuestion[],
  totalScore: number,
): SelectedQuestion[] | string {
  const empty = questions.filter((q) => q.points === null);
  if (empty.length === 0) {
    return "Todas as questões já têm pontos.";
  }

  const remaining = round2(totalScore - sumPoints(questions));
  if (remaining <= 0) {
    return "Não há pontos restantes para distribuir.";
  }

  const share = Math.floor((remaining * 100) / empty.length + 1e-9) / 100;
  if (share <= 0) {
    return "O valor restante é pequeno demais para dividir entre as questões.";
  }

  const leftover = round2(remaining - share * empty.length);
  let filled = 0;

  return questions.map((q) => {
    if (q.points !== null) return q;
    filled += 1;
    return {
      ...q,
      points: filled === empty.length ? round2(share + leftover) : share,
    };
  });
}