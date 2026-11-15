import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
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

const buildClass = (id: string, name: string, pending?: number) => ({
  id,
  name,
  joinCode: `COD-${id}`,
  teacherName: "Professora",
  subjectName: "Matemática",
  courseName: "Engenharia",
  studentsCount: 10,
  averageScore: null,
  pendingRequestsCount: pending,
});

describe("ClassesAdminPage - solicitações pendentes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra o selo só nas turmas com solicitações pendentes", async () => {
    vi.mocked(classesService.listClasses).mockResolvedValue([
      buildClass("c1", "Turma A", 3),
      buildClass("c2", "Turma B", 1),
      buildClass("c3", "Turma C", 0),
      buildClass("c4", "Turma D"),
    ]);
    render(<ClassesAdminPage />);

    await waitFor(() => screen.getByText("Turma A"));

    const plural = screen.getByText("3 pendentes");
    expect(plural.closest("a")).toHaveAttribute("href", "/classes/c1");
    const singular = screen.getByText("1 pendente");
    expect(singular.closest("a")).toHaveAttribute("href", "/classes/c2");
    expect(screen.getAllByText(/pendente/)).toHaveLength(2);
  });
});