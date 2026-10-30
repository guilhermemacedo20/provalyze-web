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

function folderNames() {
  return screen
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
}

function buildQuestions(total: number) {
  return Array.from({ length: total }, (_, index) => ({
    id: `q${index + 1}`,
    statement: `Questão ${String(index + 1).padStart(2, "0")}`,
    type: "MULTIPLE_CHOICE" as const,
    themeId: "t1",
  }));
}

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

  it("lista os temas em ordem alfabética, pagina de 6 em 6 e filtra pela busca", async () => {
    const user = userEvent.setup();
    vi.mocked(themesService.listThemes).mockResolvedValue([
      { id: "t1", name: "Zoologia" },
      { id: "t2", name: "Álgebra" },
      { id: "t3", name: "Banco de dados" },
      { id: "t4", name: "Redes" },
      { id: "t5", name: "Cálculo" },
      { id: "t6", name: "Física" },
      { id: "t7", name: "Ética" },
      { id: "t8", name: "Lógica" },
    ]);
    vi.mocked(questionsService.listQuestions).mockResolvedValue([]);

    render(
      <QuestionPicker
        selected={[]}
        onChange={vi.fn()}
        openTheme={null}
        onOpenTheme={vi.fn()}
        totalScore={10}
      />,
    );

    await waitFor(() => expect(folderNames()).toHaveLength(6));
    expect(folderNames()).toEqual([
      "Álgebra",
      "Banco de dados",
      "Cálculo",
      "Ética",
      "Física",
      "Lógica",
    ]);
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(folderNames()).toEqual(["Redes", "Zoologia"]);

    await user.type(screen.getByLabelText("Pesquisar temas"), "algebra");
    expect(folderNames()).toEqual(["Álgebra"]);
    expect(
      screen.queryByRole("navigation", { name: "Paginação dos temas" }),
    ).not.toBeInTheDocument();
  });

  it("avisa quando a busca de temas não encontra nada", async () => {
    const user = userEvent.setup();
    vi.mocked(themesService.listThemes).mockResolvedValue([
      { id: "t1", name: "Lógica" },
    ]);
    vi.mocked(questionsService.listQuestions).mockResolvedValue([]);

    render(
      <QuestionPicker
        selected={[]}
        onChange={vi.fn()}
        openTheme={null}
        onOpenTheme={vi.fn()}
        totalScore={10}
      />,
    );

    await waitFor(() => expect(folderNames()).toEqual(["Lógica"]));
    await user.type(screen.getByLabelText("Pesquisar temas"), "xyz");

    expect(screen.getByText(/Nenhum tema encontrado/)).toBeInTheDocument();
  });

  it("pagina as questões do tema de 10 em 10", async () => {
    const user = userEvent.setup();
    vi.mocked(questionsService.listQuestions).mockResolvedValue(
      buildQuestions(23),
    );

    render(
      <QuestionPicker
        selected={[]}
        onChange={vi.fn()}
        openTheme={{ id: "t1", name: "Lógica" }}
        onOpenTheme={vi.fn()}
        totalScore={10}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByRole("checkbox")).toHaveLength(10),
    );
    expect(screen.getByText("Questão 01")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(screen.getByText("Questão 21")).toBeInTheDocument();
  });

  it("mantém as questões marcadas ao trocar de página e adiciona todas", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    vi.mocked(questionsService.listQuestions).mockResolvedValue(
      buildQuestions(12),
    );

    render(
      <QuestionPicker
        selected={[]}
        onChange={onChange}
        openTheme={{ id: "t1", name: "Lógica" }}
        onOpenTheme={vi.fn()}
        totalScore={10}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByRole("checkbox")).toHaveLength(10),
    );

    await user.click(
      screen.getByRole("checkbox", { name: "Selecionar questão: Questão 01" }),
    );
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Selecionar questão: Questão 11" }),
    );
    await user.click(screen.getByRole("button", { name: "Página anterior" }));

    expect(
      screen.getByRole("checkbox", { name: "Selecionar questão: Questão 01" }),
    ).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ questionId: "q1" }),
        expect.objectContaining({ questionId: "q11" }),
      ]),
    );
  });
});