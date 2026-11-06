import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddStudentPage from "@/app/classes/[classId]/novo-aluno/page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ classId: "turma-1" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/services/classes.service", () => ({
  classesService: { getClass: vi.fn(), addStudent: vi.fn() },
}));

vi.mock("@/services/users.service", () => ({
  usersService: { listUsers: vi.fn() },
}));

import { classesService } from "@/services/classes.service";
import { usersService } from "@/services/users.service";

function studentNames() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[1].textContent);
}

function buildStudent(id: string, name: string) {
  return {
    id,
    name,
    email: `${id}@escola.com`,
    role: "STUDENT" as const,
    classes: [],
    createdAt: "",
  };
}

describe("AddStudentPage", () => {
  beforeEach(() => {
    vi.mocked(classesService.getClass).mockResolvedValue({
      id: "turma-1",
      name: "Turma A",
      joinCode: "ABC123",
      teacherName: "Prof",
      subjectName: "Mat",
      courseName: "Eng",
      students: [{ id: "ja-na-turma", name: "Já Matriculado", email: "x@x.com" }],
    });
  });

  it("lista os alunos em ordem alfabética e esconde quem já está na turma", async () => {
    vi.mocked(usersService.listUsers).mockResolvedValue([
      buildStudent("a", "Zélia"),
      buildStudent("b", "Ágata"),
      buildStudent("c", "bruno"),
      buildStudent("ja-na-turma", "Já Matriculado"),
    ]);

    render(<AddStudentPage />);

    await waitFor(() => expect(studentNames()).toHaveLength(3));
    expect(studentNames()).toEqual(["Ágata", "bruno", "Zélia"]);
  });

  it("pagina os alunos de 20 em 20", async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.listUsers).mockResolvedValue(
      Array.from({ length: 45 }, (_, index) =>
        buildStudent(`s${index + 1}`, `Aluno ${String(index + 1).padStart(2, "0")}`),
      ),
    );

    render(<AddStudentPage />);

    await waitFor(() => expect(studentNames()).toHaveLength(20));
    expect(studentNames()[0]).toBe("Aluno 01");
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(studentNames()).toHaveLength(5);
    expect(studentNames()[0]).toBe("Aluno 41");
    expect(screen.getByText("Página 3 de 3")).toBeInTheDocument();
  });

  it("busca por nome ou e-mail sem diferenciar acento e volta para a página 1", async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.listUsers).mockResolvedValue([
      ...Array.from({ length: 25 }, (_, index) =>
        buildStudent(`s${index + 1}`, `Aluno ${String(index + 1).padStart(2, "0")}`),
      ),
      buildStudent("zoe", "Zoé Álvares"),
    ]);

    render(<AddStudentPage />);

    await waitFor(() => expect(studentNames()).toHaveLength(20));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Buscar aluno"), "alvares");

    expect(studentNames()).toEqual(["Zoé Álvares"]);
  });

  it("mantém o aluno marcado no topo da lista", async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.listUsers).mockResolvedValue([
      buildStudent("a", "Ana"),
      buildStudent("b", "Bia"),
      buildStudent("c", "Caio"),
    ]);

    render(<AddStudentPage />);

    await waitFor(() => expect(studentNames()).toHaveLength(3));
    await user.click(screen.getByRole("checkbox", { name: "Selecionar Caio" }));

    expect(studentNames()).toEqual(["Caio", "Ana", "Bia"]);
    expect(screen.getByRole("button", { name: "Concluir (1)" })).toBeInTheDocument();
  });
});