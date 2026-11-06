import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QuestionsPage from "@/app/questions/page";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("@/services/themes.service", () => ({
  themesService: {
    listThemes: vi.fn(),
    createTheme: vi.fn(),
    deleteTheme: vi.fn(),
  },
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

describe("QuestionsPage", () => {
  beforeEach(() => {
    vi.mocked(questionsService.listQuestions).mockResolvedValue([]);
  });

  it("lista as pastas em ordem alfabética, ignorando acento e maiúsculas", async () => {
    vi.mocked(themesService.listThemes).mockResolvedValue([
      { id: "t1", name: "Zebra" },
      { id: "t2", name: "Álgebra" },
      { id: "t3", name: "banco de dados" },
    ]);

    render(<QuestionsPage />);

    await waitFor(() => expect(folderNames()).toHaveLength(3));
    expect(folderNames()).toEqual(["Álgebra", "banco de dados", "Zebra"]);
  });

  it("pagina as pastas de 8 em 8 com as setinhas", async () => {
    const user = userEvent.setup();
    vi.mocked(themesService.listThemes).mockResolvedValue(
      Array.from({ length: 10 }, (_, index) => ({
        id: `t${index + 1}`,
        name: `Tema ${String(index + 1).padStart(2, "0")}`,
      })),
    );

    render(<QuestionsPage />);

    await waitFor(() => expect(folderNames()).toHaveLength(8));
    expect(folderNames()[0]).toBe("Tema 01");
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Página anterior" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(folderNames()).toEqual(["Tema 09", "Tema 10"]);
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Próxima página" }),
    ).toBeDisabled();
  });

  it("não mostra paginação quando cabe em uma página", async () => {
    vi.mocked(themesService.listThemes).mockResolvedValue([
      { id: "t1", name: "Lógica" },
    ]);

    render(<QuestionsPage />);

    await waitFor(() => expect(folderNames()).toEqual(["Lógica"]));
    expect(
      screen.queryByRole("navigation", { name: "Paginação das pastas" }),
    ).not.toBeInTheDocument();
  });

  it("filtra pela busca sem diferenciar acento e volta para a página 1", async () => {
    const user = userEvent.setup();
    vi.mocked(themesService.listThemes).mockResolvedValue([
      ...Array.from({ length: 9 }, (_, index) => ({
        id: `t${index + 1}`,
        name: `Tema ${index + 1}`,
      })),
      { id: "t10", name: "Álgebra" },
    ]);

    render(<QuestionsPage />);

    await waitFor(() => expect(folderNames()).toHaveLength(8));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Pesquisar pastas"), "algebra");

    expect(folderNames()).toEqual(["Álgebra"]);
    expect(
      screen.queryByRole("navigation", { name: "Paginação das pastas" }),
    ).not.toBeInTheDocument();
  });

  it("avisa quando a busca não encontra nenhuma pasta", async () => {
    const user = userEvent.setup();
    vi.mocked(themesService.listThemes).mockResolvedValue([
      { id: "t1", name: "Lógica" },
    ]);

    render(<QuestionsPage />);

    await waitFor(() => expect(folderNames()).toEqual(["Lógica"]));
    await user.type(screen.getByLabelText("Pesquisar pastas"), "xyz");

    expect(screen.getByText(/Nenhuma pasta encontrada/)).toBeInTheDocument();
  });
});