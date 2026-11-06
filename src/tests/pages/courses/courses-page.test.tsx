import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CoursesPage from "@/app/courses/page";

vi.mock("@/services/courses.service", () => ({
  coursesService: {
    listCourses: vi.fn(),
    createCourse: vi.fn(),
    deleteCourse: vi.fn(),
  },
}));

import { coursesService } from "@/services/courses.service";

function courseNames() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent);
}

describe("CoursesPage", () => {
  beforeEach(() => {
    vi.mocked(coursesService.listCourses).mockReset();
  });

  it("lista os cursos em ordem alfabética, ignorando acento e maiúsculas", async () => {
    vi.mocked(coursesService.listCourses).mockResolvedValue([
      { id: "c1", name: "Zootecnia", createdAt: "01/01/2026" },
      { id: "c2", name: "Álgebra aplicada", createdAt: "01/01/2026" },
      { id: "c3", name: "biologia", createdAt: "01/01/2026" },
    ]);

    render(<CoursesPage />);

    await waitFor(() => expect(courseNames()).toHaveLength(3));
    expect(courseNames()).toEqual(["Álgebra aplicada", "biologia", "Zootecnia"]);
  });

  it("pagina os cursos de 10 em 10", async () => {
    const user = userEvent.setup();
    vi.mocked(coursesService.listCourses).mockResolvedValue(
      Array.from({ length: 12 }, (_, index) => ({
        id: `c${index + 1}`,
        name: `Curso ${String(12 - index).padStart(2, "0")}`,
        createdAt: "01/01/2026",
      })),
    );

    render(<CoursesPage />);

    await waitFor(() => expect(courseNames()).toHaveLength(10));
    expect(courseNames()[0]).toBe("Curso 01");
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(courseNames()).toEqual(["Curso 11", "Curso 12"]);
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
  });

  it("busca sem diferenciar acento e volta para a página 1", async () => {
    const user = userEvent.setup();
    vi.mocked(coursesService.listCourses).mockResolvedValue([
      ...Array.from({ length: 11 }, (_, index) => ({
        id: `c${index + 1}`,
        name: `Curso ${String(index + 1).padStart(2, "0")}`,
        createdAt: "01/01/2026",
      })),
      { id: "c99", name: "Álgebra", createdAt: "01/01/2026" },
    ]);

    render(<CoursesPage />);

    await waitFor(() => expect(courseNames()).toHaveLength(10));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Pesquisar..."), "algebra");

    expect(courseNames()).toEqual(["Álgebra"]);
    expect(
      screen.queryByRole("navigation", { name: "Paginação dos cursos" }),
    ).not.toBeInTheDocument();
  });
});