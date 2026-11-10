import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MyClassesPage from "@/app/my-classes/page";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/services/classes.service", () => ({
  classesService: {
    listStudentClasses: vi.fn(),
    joinClass: vi.fn(),
    hideClass: vi.fn(),
    unhideClass: vi.fn(),
  },
}));

import { classesService } from "@/services/classes.service";

const buildClass = (id: string, subjectName: string, hidden = false) => ({
  id,
  name: `Turma ${id}`,
  joinCode: "",
  teacherName: "Professora",
  subjectName,
  courseName: "Engenharia",
  studentsCount: 0,
  averageScore: null,
  hidden,
});

describe("MyClassesPage - matérias ocultas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não mostra a seção de ocultas quando não há matérias ocultas", async () => {
    vi.mocked(classesService.listStudentClasses).mockResolvedValue([
      buildClass("c1", "Cálculo"),
    ]);
    render(<MyClassesPage />);

    await waitFor(() => screen.getByText("Cálculo"));
    expect(screen.queryByText(/Matérias ocultas/)).not.toBeInTheDocument();
  });

  it("mantém as ocultas recolhidas e abre ao clicar", async () => {
    vi.mocked(classesService.listStudentClasses).mockResolvedValue([
      buildClass("c1", "Cálculo"),
      buildClass("c2", "Física", true),
    ]);
    const user = userEvent.setup();
    render(<MyClassesPage />);

    await waitFor(() => screen.getByText("Cálculo"));
    expect(screen.queryByText("Física")).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: /Matérias ocultas \(1\)/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Física")).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByText("Física")).not.toBeInTheDocument();
  });

  it("oculta uma matéria e recarrega a lista", async () => {
    vi.mocked(classesService.listStudentClasses)
      .mockResolvedValueOnce([buildClass("c1", "Cálculo")])
      .mockResolvedValueOnce([buildClass("c1", "Cálculo", true)]);
    vi.mocked(classesService.hideClass).mockResolvedValue({ hidden: true });
    const user = userEvent.setup();
    render(<MyClassesPage />);

    await waitFor(() => screen.getByText("Cálculo"));
    await user.click(
      screen.getByRole("button", { name: "Ocultar matéria Cálculo" }),
    );

    expect(classesService.hideClass).toHaveBeenCalledWith("c1");
    await waitFor(() => {
      expect(screen.getByText("Sem classes encontradas")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /Matérias ocultas \(1\)/ }),
    ).toBeInTheDocument();
  });

  it("reexibe uma matéria oculta", async () => {
    vi.mocked(classesService.listStudentClasses)
      .mockResolvedValueOnce([buildClass("c2", "Física", true)])
      .mockResolvedValueOnce([buildClass("c2", "Física")]);
    vi.mocked(classesService.unhideClass).mockResolvedValue({ hidden: false });
    const user = userEvent.setup();
    render(<MyClassesPage />);

    await waitFor(() => screen.getByText(/Matérias ocultas/));
    await user.click(screen.getByRole("button", { name: /Matérias ocultas/ }));
    await user.click(
      screen.getByRole("button", { name: "Reexibir matéria Física" }),
    );

    expect(classesService.unhideClass).toHaveBeenCalledWith("c2");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Ocultar matéria Física" }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/Matérias ocultas/)).not.toBeInTheDocument();
  });
});