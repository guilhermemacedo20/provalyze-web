import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuestionPicker } from "@/components/exams/QuestionPicker";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("@/services/themes.service", () => ({
  themesService: { listThemes: vi.fn() },
}));

vi.mock("@/services/questions.service", () => ({
  questionsService: { listQuestions: vi.fn() },
}));

import { questionsService } from "@/services/questions.service";
import { themesService } from "@/services/themes.service";

describe("QuestionPicker", () => {
  it("lista temas do banco de questões", async () => {
    vi.mocked(themesService.listThemes).mockResolvedValue([
      { id: "t1", name: "Lógica" },
    ]);
    vi.mocked(questionsService.listQuestions).mockResolvedValue([
      {
        id: "q1",
        statement: "2+2?",
        type: "MULTIPLE_CHOICE",
        themeId: "t1",
      },
    ]);

    render(
      <QuestionPicker
        selected={[]}
        onChange={vi.fn()}
        openTheme={null}
        onOpenTheme={vi.fn()}
        totalScore={10}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Lógica")).toBeInTheDocument();
    });
    expect(screen.getByText(/1 questão/i)).toBeInTheDocument();
  });

  it("abre questões do tema selecionado", async () => {
    vi.mocked(themesService.listThemes).mockResolvedValue([
      { id: "t1", name: "Lógica" },
    ]);
    vi.mocked(questionsService.listQuestions).mockResolvedValue([
      {
        id: "q1",
        statement: "2+2?",
        type: "MULTIPLE_CHOICE",
        themeId: "t1",
        questionOptions: [{ label: "A", text: "4", isCorrect: true }],
      },
    ]);

    const user = userEvent.setup();
    const onOpenTheme = vi.fn();

    render(
      <QuestionPicker
        selected={[]}
        onChange={vi.fn()}
        openTheme={null}
        onOpenTheme={onOpenTheme}
        totalScore={10}
      />,
    );

    await waitFor(() => screen.getByText("Lógica"));
    await user.click(screen.getByRole("button", { name: /Lógica/i }));
    expect(onOpenTheme).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1", name: "Lógica" }),
    );
  });
});
