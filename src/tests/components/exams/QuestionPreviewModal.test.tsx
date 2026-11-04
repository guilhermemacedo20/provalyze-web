import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuestionPreviewModal } from "@/components/exams/QuestionPreviewModal";
import type { Question } from "@/services/questions.service";

vi.mock("@/components/questions/QuestionImage", () => ({
  QuestionImage: ({ alt }: { alt?: string }) => <img alt={alt} />,
}));

vi.mock("@/services/questions.service", () => ({
  questionsService: { getQuestion: vi.fn() },
}));

import { questionsService } from "@/services/questions.service";

const baseQuestion: Question = {
  id: "q1",
  statement: "Enunciado completo da questão",
  type: "MULTIPLE_CHOICE",
  themeId: "t1",
};

describe("QuestionPreviewModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra o enunciado, as alternativas e destaca a correta", async () => {
    vi.mocked(questionsService.getQuestion).mockResolvedValue({
      ...baseQuestion,
      questionOptions: [
        { label: "A", text: "Três", isCorrect: false },
        { label: "B", text: "Quatro", isCorrect: true },
      ],
    });

    render(
      <QuestionPreviewModal
        question={baseQuestion}
        themeName="Lógica"
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Questão completa" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Enunciado completo da questão")).toBeInTheDocument();
    expect(screen.getByText(/Objetiva · Lógica/)).toBeInTheDocument();

    expect(await screen.findByText("Três")).toBeInTheDocument();
    expect(screen.getByText("Quatro")).toBeInTheDocument();
    expect(screen.getByText("Correta")).toBeInTheDocument();
    expect(questionsService.getQuestion).toHaveBeenCalledWith("q1");
  });

  it("mostra a imagem da questão quando existir", async () => {
    vi.mocked(questionsService.getQuestion).mockResolvedValue({
      ...baseQuestion,
      imageUrl: "/questions/images/img1",
      questionOptions: [],
    });

    render(
      <QuestionPreviewModal
        question={baseQuestion}
        themeName="Lógica"
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByAltText("Imagem da questão")).toBeInTheDocument();
  });

  it("não mostra alternativas em questão dissertativa", async () => {
    const open: Question = { ...baseQuestion, type: "OPEN_ENDED" };
    vi.mocked(questionsService.getQuestion).mockResolvedValue(open);

    render(
      <QuestionPreviewModal
        question={open}
        themeName="Lógica"
        onClose={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.queryByText(/Carregando alternativas/i),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText(/Dissertativa · Lógica/)).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("mostra a mensagem de erro quando a busca falha", async () => {
    vi.mocked(questionsService.getQuestion).mockRejectedValue(
      new Error("Falha ao buscar a questão"),
    );

    render(
      <QuestionPreviewModal
        question={baseQuestion}
        themeName="Lógica"
        onClose={vi.fn()}
      />,
    );

    expect(
      await screen.findByText("Falha ao buscar a questão"),
    ).toBeInTheDocument();
    expect(screen.getByText("Enunciado completo da questão")).toBeInTheDocument();
  });

  it("fecha pelo botão Fechar e pela tecla Esc", async () => {
    vi.mocked(questionsService.getQuestion).mockResolvedValue(baseQuestion);
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <QuestionPreviewModal
        question={baseQuestion}
        themeName="Lógica"
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);

    await waitFor(() =>
      expect(
        screen.queryByText(/Carregando alternativas/i),
      ).not.toBeInTheDocument(),
    );
  });
});