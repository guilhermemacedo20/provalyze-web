import { ExamRunner } from "@/app/my-exams/[classId]/[examId]/exam-runner";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("@/services/exams.service", () => ({
  examsService: { createExamEvent: vi.fn() },
}));

const question = {
  id: "eq1",
  questionId: "q1",
  points: 10,
  statement: "Pergunta teste",
  type: "MULTIPLE_CHOICE" as const,
  themeName: "Mat",
  imageUrl: null,
  options: [
    { id: "o1", label: "A", text: "3" },
    { id: "o2", label: "B", text: "4" },
  ],
};

describe("ExamRunner", () => {
  it("permite responder e entregar prova objetiva", async () => {
    const onAnswer = vi.fn();
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <ExamRunner
        title="Prova"
        subjectName="Mat"
        questions={[question]}
        answers={{}}
        classId="c1"
        examId="e1"
        submitting={false}
        error={null}
        expiresAt={new Date(Date.now() + 60_000).toISOString()}
        onAnswer={onAnswer}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText("Pergunta teste")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /4/ }));
    expect(onAnswer).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Finalizar prova/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/1 questão não respondida/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Encerrar prova" }));
    expect(onSubmit).toHaveBeenCalled();
  });
});
