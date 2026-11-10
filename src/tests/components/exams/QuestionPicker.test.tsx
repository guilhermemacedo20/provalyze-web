import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuestionPicker } from "@/components/exams/QuestionPicker";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("@/components/questions/QuestionImage", () => ({
  QuestionImage: ({ alt }: { alt?: string }) => <img alt={alt} />,
}));

vi.mock("@/services/themes.service", () => ({
  themesService: { listThemes: vi.fn() },
}));

vi.mock("@/services/questions.service", () => ({
  questionsService: { listQuestions: vi.fn(), getQuestion: vi.fn() },
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

function buildSelected(points: (number | null)[], distributed: number[] = []) {
  return points.map((value, index) => ({
    questionId: `q${index + 1}`,
    points: value,
    ...(distributed.includes(index) ? { autoPoints: true } : {}),
    statement: `Questão ${String(index + 1).padStart(2, "0")}`,
    themeId: "t1",
    themeName: "Lógica",
    type: "MULTIPLE_CHOICE" as const,
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

  it("abre o modal com a questão completa sem marcar a questão", async () => {
    vi.mocked(questionsService.listQuestions).mockResolvedValue([
      {
        id: "q1",
        statement: "Qual é o resultado de 2+2?",
        type: "MULTIPLE_CHOICE",
        themeId: "t1",
      },
    ]);
    vi.mocked(questionsService.getQuestion).mockResolvedValue({
      id: "q1",
      statement: "Qual é o resultado de 2+2?",
      type: "MULTIPLE_CHOICE",
      themeId: "t1",
      questionOptions: [
        { label: "A", text: "Três", isCorrect: false },
        { label: "B", text: "Quatro", isCorrect: true },
      ],
    });

    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <QuestionPicker
        selected={[]}
        onChange={onChange}
        openTheme={{ id: "t1", name: "Lógica" }}
        onOpenTheme={vi.fn()}
        totalScore={10}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: /Ver questão completa/i }),
    );

    expect(
      await screen.findByRole("dialog", { name: "Questão completa" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Quatro")).toBeInTheDocument();
    expect(screen.getByText("Correta")).toBeInTheDocument();

    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  describe("pontuação distribuída", () => {
    const renderPicker = (
      points: (number | null)[],
      distributed: number[] = [],
      onChange = vi.fn(),
    ) => {
      vi.mocked(themesService.listThemes).mockResolvedValue([]);
      vi.mocked(questionsService.listQuestions).mockResolvedValue([]);

      render(
        <QuestionPicker
          selected={buildSelected(points, distributed)}
          onChange={onChange}
          openTheme={null}
          onOpenTheme={vi.fn()}
          totalScore={10}
        />,
      );
      return onChange;
    };

    it("não mostra o botão de limpar quando os pontos foram digitados", async () => {
      renderPicker([5, 3]);

      await waitFor(() =>
        expect(screen.getAllByLabelText("Pontos da questão")).toHaveLength(2),
      );
      expect(
        screen.queryByRole("button", { name: "Limpar pontuação" }),
      ).not.toBeInTheDocument();
    });

    it("marca como distribuídas só as questões que receberam pontos", async () => {
      const user = userEvent.setup();
      const onChange = renderPicker([5, null, null]);

      await user.click(
        await screen.findByRole("button", { name: /Distribuir igualmente/ }),
      );

      expect(onChange).toHaveBeenCalledTimes(1);
      const next = onChange.mock.calls[0][0];
      expect(next[0]).toMatchObject({ questionId: "q1", points: 5 });
      expect(next[0].autoPoints).toBeUndefined();
      expect(next[1]).toMatchObject({
        questionId: "q2",
        points: 2.5,
        autoPoints: true,
      });
      expect(next[2]).toMatchObject({
        questionId: "q3",
        points: 2.5,
        autoPoints: true,
      });
    });

    it("limpa só os pontos distribuídos e mantém os digitados", async () => {
      const user = userEvent.setup();
      const onChange = renderPicker([5, 2.5, 2.5], [1, 2]);

      await user.click(
        await screen.findByRole("button", { name: "Limpar pontuação" }),
      );
      expect(screen.getByText("Limpar a pontuação?")).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "Limpar" }));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ questionId: "q1", points: 5 }),
        expect.objectContaining({
          questionId: "q2",
          points: null,
          autoPoints: false,
        }),
        expect.objectContaining({
          questionId: "q3",
          points: null,
          autoPoints: false,
        }),
      ]);
      expect(
        screen.queryByText("Limpar a pontuação?"),
      ).not.toBeInTheDocument();
    });

    it("não altera nada quando cancela a confirmação", async () => {
      const user = userEvent.setup();
      const onChange = renderPicker([5, 2.5], [1]);

      await user.click(
        await screen.findByRole("button", { name: "Limpar pontuação" }),
      );
      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(onChange).not.toHaveBeenCalled();
      expect(
        screen.queryByText("Limpar a pontuação?"),
      ).not.toBeInTheDocument();
    });

    it("trata como digitado o valor que o professor edita depois de distribuir", async () => {
      const user = userEvent.setup();
      const onChange = renderPicker([5, 2.5], [1]);

      const inputs = await screen.findAllByLabelText("Pontos da questão");
      await user.clear(inputs[1]);
      await user.type(inputs[1], "7");

      expect(onChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ questionId: "q1", points: 5 }),
        expect.objectContaining({
          questionId: "q2",
          points: 7,
          autoPoints: false,
        }),
      ]);
    });
  });
});