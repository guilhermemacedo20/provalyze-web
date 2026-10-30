import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CourseSubjectsPage from "@/app/courses/[courseId]/page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ courseId: "c1" }),
}));

vi.mock("@/services/courses.service", () => ({
  coursesService: { getCourse: vi.fn() },
}));

vi.mock("@/services/subjects.service", () => ({
  subjectsService: {
    listSubjects: vi.fn(),
    createSubject: vi.fn(),
    deleteSubject: vi.fn(),
  },
}));

import { coursesService } from "@/services/courses.service";
import { subjectsService } from "@/services/subjects.service";

function subjectNames() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent);
}

function buildSubject(id: string, name: string) {
  return { id, name, courseId: "c1", createdAt: "01/01/2026" };
}

describe("CourseSubjectsPage", () => {
  beforeEach(() => {
    vi.mocked(coursesService.getCourse).mockResolvedValue({
      id: "c1",
      name: "Engenharia",
      createdAt: "01/01/2026",
    });
  });

  it("lista as matérias em ordem alfabética", async () => {
    vi.mocked(subjectsService.listSubjects).mockResolvedValue([
      buildSubject("s1", "Redes"),
      buildSubject("s2", "Álgebra"),
      buildSubject("s3", "banco de dados"),
    ]);

    render(<CourseSubjectsPage />);

    await waitFor(() => expect(subjectNames()).toHaveLength(3));
    expect(subjectNames()).toEqual(["Álgebra", "banco de dados", "Redes"]);
  });

  it("pagina as matérias de 10 em 10 e filtra pela busca", async () => {
    const user = userEvent.setup();
    vi.mocked(subjectsService.listSubjects).mockResolvedValue([
      ...Array.from({ length: 11 }, (_, index) =>
        buildSubject(`s${index + 1}`, `Matéria ${String(index + 1).padStart(2, "0")}`),
      ),
      buildSubject("s99", "Cálculo"),
    ]);

    render(<CourseSubjectsPage />);

    await waitFor(() => expect(subjectNames()).toHaveLength(10));
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Pesquisar..."), "calculo");

    expect(subjectNames()).toEqual(["Cálculo"]);
    expect(
      screen.queryByRole("navigation", { name: "Paginação das matérias" }),
    ).not.toBeInTheDocument();
  });
});