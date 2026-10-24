import { describe, expect, it } from "vitest";
import {
  distributeEqually,
  parsePoints,
  round2,
  sumPoints,
  typeLabel,
  type SelectedQuestion,
} from "@/components/exams/exam-wizard-types";

const baseQuestion = (
  overrides: Partial<SelectedQuestion> = {},
): SelectedQuestion => ({
  questionId: "q1",
  points: null,
  statement: "Enunciado",
  themeId: "t1",
  themeName: "Tema",
  type: "MULTIPLE_CHOICE",
  ...overrides,
});

describe("exam-wizard-types", () => {
  it("valida parsePoints e soma", () => {
    expect(parsePoints("2,5")).toBe(2.5);
    expect(parsePoints("0")).toBeNull();
    expect(round2(1.005)).toBe(1);
    expect(
      sumPoints([
        baseQuestion({ points: 5 }),
        baseQuestion({ questionId: "q2", points: 5 }),
      ]),
    ).toBe(10);
  });

  it("rotula tipos de questão", () => {
    expect(typeLabel("OPEN_ENDED")).toBe("Dissertativa");
    expect(typeLabel("MULTIPLE_CHOICE")).toBe("Objetiva");
    expect(typeLabel(null)).toBe("Tipo desconhecido");
  });

  it("distribui pontos restantes entre questões sem nota", () => {
    const result = distributeEqually(
      [
        baseQuestion({ points: 5 }),
        baseQuestion({ questionId: "q2" }),
        baseQuestion({ questionId: "q3" }),
      ],
      10,
    );
    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      expect(sumPoints(result)).toBe(10);
    }
  });

  it("retorna mensagem quando não há pontos para distribuir", () => {
    expect(
      distributeEqually([baseQuestion({ points: 10 })], 10),
    ).toMatch(/já têm pontos/);
  });
});
