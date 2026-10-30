import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ThemeQuestionsPage from "@/app/themes/[id]/page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "t1" }),
}));

vi.mock("@/services/themes.service", () => ({
  themesService: { getTheme: vi.fn() },
}));

vi.mock("@/services/questions.service", () => ({
  questionsService: { listQuestions: vi.fn(), deleteQuestion: vi.fn() },
}));

import { questionsService } from "@/services/questions.service";
import { themesService } from "@/services/themes.service";

function statements() {
  return screen
    .getAllByText(/^Questão \d+|Cálculo|Pergunta/)
    .map((element) => element.textContent);
}

function buildQuestions(total: number) {
  return Array.from({ length: total }, (_, index) => ({
    id: `q${index + 1}`,
    statement: `Questão ${String(index + 1).padStart(2, "0")}`,
    type: "MULTIPLE_CHOICE" as const,
    themeId: "t1",
  }));
}

describe("ThemeQuestionsPage", () => {
  it("pagina as questões do tema de 10 em 10", async () => {
    const user = userEvent.setup();
    vi.mocked(themesService.getTheme).mockResolvedValue({
      id: "t1",
      name: "Lógica",
    });
    vi.mocked(questionsService.listQuestions).mockResolvedValue(
      buildQuestions(23),
    );

    render(<ThemeQuestionsPage />);

    await waitFor(() => expect(statements()).toHaveLength(10));
    expect(statements()[0]).toBe("Questão 01");
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(statements()).toEqual(["Questão 21", "Questão 22", "Questão 23"]);
    expect(screen.getByText("Página 3 de 3")).toBeInTheDocument();
  });

  it("busca sem diferenciar acento e volta para a página 1", async () => {
    const user = userEvent.setup();
    vi.mocked(themesService.getTheme).mockResolvedValue({
      id: "t1",
      name: "Lógica",
    });
    vi.mocked(questionsService.listQuestions).mockResolvedValue([
      ...buildQuestions(12),
      {
        id: "q99",
        statement: "Cálculo de limites",
        type: "OPEN_ENDED" as const,
        themeId: "t1",
      },
    ]);

    render(<ThemeQuestionsPage />);

    await waitFor(() => expect(statements()).toHaveLength(10));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Pesquisar..."), "calculo");

    expect(statements()).toEqual(["Cálculo de limites"]);
    expect(
      screen.queryByRole("navigation", { name: "Paginação das questões" }),
    ).not.toBeInTheDocument();
  });

  it("filtra por tipo e volta para a página 1", async () => {
    const user = userEvent.setup();
    vi.mocked(themesService.getTheme).mockResolvedValue({
      id: "t1",
      name: "Lógica",
    });
    vi.mocked(questionsService.listQuestions).mockResolvedValue([
      ...buildQuestions(12),
      {
        id: "q99",
        statement: "Pergunta dissertativa",
        type: "OPEN_ENDED" as const,
        themeId: "t1",
      },
    ]);

    render(<ThemeQuestionsPage />);

    await waitFor(() => expect(statements()).toHaveLength(10));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    await user.selectOptions(
      screen.getByLabelText("Tipo de questão:"),
      "OPEN_ENDED",
    );

    expect(statements()).toEqual(["Pergunta dissertativa"]);
  });
});