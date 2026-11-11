import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClassesAdminPage from "@/app/classes/page";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/services/classes.service", () => ({
  classesService: {
    listClasses: vi.fn(),
    deleteClass: vi.fn(),
  },
}));

import { classesService } from "@/services/classes.service";

const buildClass = (index: number) => ({
  id: `c${index}`,
  name: `Turma ${index}`,
  joinCode: `COD${index}`,
  teacherName: "Professora",
  subjectName: "Matemática",
  courseName: "Engenharia",
  studentsCount: 10,
  averageScore: 7.5,
});

describe("ClassesAdminPage - paginação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra 9 turmas por página e navega entre as páginas", async () => {
    vi.mocked(classesService.listClasses).mockResolvedValue(
      Array.from({ length: 11 }, (_, i) => buildClass(i + 1)),
    );
    const user = userEvent.setup();
    render(<ClassesAdminPage />);

    await waitFor(() => screen.getByText("Turma 1"));
    expect(screen.getByText("Turma 9")).toBeInTheDocument();
    expect(screen.queryByText("Turma 10")).not.toBeInTheDocument();
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(screen.getByText("Turma 10")).toBeInTheDocument();
    expect(screen.getByText("Turma 11")).toBeInTheDocument();
    expect(screen.queryByText("Turma 1")).not.toBeInTheDocument();
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
  });

  it("não mostra paginação com poucas turmas", async () => {
    vi.mocked(classesService.listClasses).mockResolvedValue([buildClass(1)]);
    render(<ClassesAdminPage />);

    await waitFor(() => screen.getByText("Turma 1"));
    expect(
      screen.queryByRole("button", { name: "Próxima página" }),
    ).not.toBeInTheDocument();
  });
});