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

  it("mostra a resposta do aluno e a alternativa correta da múltipla escolha", () => {
    render(
      <ExamResult
        title="Prova 1"
        subjectName="Mat"
        score={0}
        startedAt="2026-06-01T10:00:00.000Z"
        finishedAt="2026-06-01T10:30:00.000Z"
        backHref="/my-classes/c1"
        review={[
          {
            examQuestionId: "eq1",
            type: "MULTIPLE_CHOICE",
            themeName: "Aritmética",
            isCorrect: false,
            score: 0,
            gradeStatus: "AUTO",
            number: 1,
            statement: "Quanto é 2+2?",
            maxScore: 10,
            studentAnswer: "B) 5",
            correctAnswer: "A) 4",
          },
        ]}
      />,
    );

    expect(screen.getByText("Correção das questões")).toBeInTheDocument();
    expect(screen.getByText("B) 5")).toBeInTheDocument();
    expect(screen.getByText("ALTERNATIVA CORRETA")).toBeInTheDocument();
    expect(screen.getByText("A) 4")).toBeInTheDocument();
  });

  it("não mostra alternativa correta em questão dissertativa", () => {
    render(
      <ExamResult
        title="Prova 1"
        subjectName="Mat"
        score={null}
        startedAt="2026-06-01T10:00:00.000Z"
        finishedAt="2026-06-01T10:30:00.000Z"
        backHref="/my-classes/c1"
        review={[
          {
            examQuestionId: "eq2",
            type: "OPEN_ENDED",
            themeName: "Algoritmos",
            isCorrect: false,
            score: 0,
            gradeStatus: "PENDING",
            number: 1,
            statement: "Explique recursão",
            maxScore: 10,
            studentAnswer: "Função que se chama",
            correctAnswer: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("Função que se chama")).toBeInTheDocument();
    expect(screen.queryByText("ALTERNATIVA CORRETA")).not.toBeInTheDocument();
  });

  it("colore a resposta pela pontuação: completa, parcial e zerada", () => {
    const { container } = render(
      <ExamResult
        title="Prova 1"
        subjectName="Mat"
        score={14}
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
            number: 1,
            statement: "Questão cheia",
            maxScore: 10,
            studentAnswer: "A",
          },
          {
            examQuestionId: "eq2",
            type: "OPEN_ENDED",
            themeName: "Lógica",
            isCorrect: true,
            score: 4,
            gradeStatus: "TEACHER_APPROVED",
            number: 2,
            statement: "Questão parcial",
            maxScore: 10,
            studentAnswer: "Quase lá",
          },
          {
            examQuestionId: "eq3",
            type: "OPEN_ENDED",
            themeName: "Lógica",
            isCorrect: false,
            score: 0,
            gradeStatus: "TEACHER_APPROVED",
            number: 3,
            statement: "Questão zerada",
            maxScore: 10,
            studentAnswer: "Errou",
          },
        ]}
      />,
    );

    const levels = Array.from(
      container.querySelectorAll("[data-score-level]"),
    ).map((element) => element.getAttribute("data-score-level"));

    expect(levels).toEqual(["full", "partial", "zero"]);
  });

  it("mostra a legenda das cores e só cita pendentes quando existem", () => {
    const base = {
      examQuestionId: "eq1",
      type: "OPEN_ENDED" as const,
      themeName: "Lógica",
      isCorrect: false,
      score: 0,
      number: 1,
      statement: "Explique",
      maxScore: 10,
      studentAnswer: "Resposta",
    };

    const { rerender } = render(
      <ExamResult
        title="Prova 1"
        subjectName="Mat"
        score={0}
        backHref="/my-classes/c1"
        review={[{ ...base, gradeStatus: "TEACHER_APPROVED" }]}
      />,
    );

    const legend = screen.getByRole("list", { name: "Legenda das cores" });
    expect(legend).toHaveTextContent("Pontuação completa");
    expect(legend).toHaveTextContent(
      "Pontuação parcial (acertou, mas sem a nota máxima)",
    );
    expect(legend).toHaveTextContent("Sem pontuação");
    expect(legend).not.toHaveTextContent("Aguardando correção");

    rerender(
      <ExamResult
        title="Prova 1"
        subjectName="Mat"
        score={null}
        backHref="/my-classes/c1"
        review={[{ ...base, gradeStatus: "PENDING" }]}
      />,
    );

    expect(
      screen.getByRole("list", { name: "Legenda das cores" }),
    ).toHaveTextContent("Aguardando correção");
  });
});