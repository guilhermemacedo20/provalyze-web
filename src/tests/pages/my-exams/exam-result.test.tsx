import { ExamResult } from "@/app/my-exams/[classId]/[examId]/exam-result";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ExamResult", () => {
  it("mostra nota e temas corrigidos", () => {
    render(
      <ExamResult
        title="Prova 1"
        subjectName="Mat"
        score={8}
        startedAt="2026-06-01T10:00:00.000Z"
        finishedAt="2026-06-01T10:30:00.000Z"
        backHref="/my-classes/c1"
        review={[
          {
            examQuestionId: "eq1",
            type: "MULTIPLE_CHOICE",
            themeName: "Lógica",
            isCorrect: true,
            score: 10,
            gradeStatus: "AUTO",
            statement: "Questão multipla escolha",
          },
          {
            examQuestionId: "eq2",
            type: "OPEN_ENDED",
            themeName: "Lógica",
            isCorrect: false,
            score: 0,
            gradeStatus: "PENDING",
            statement: "Questão dissertativa",
          },
        ]}
      />,
    );

    expect(screen.getByText("Prova 1")).toBeInTheDocument();
    expect(screen.getByText(/Correção automática/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Aguardando correção do professor/i),
    ).toBeInTheDocument();
  });
});
