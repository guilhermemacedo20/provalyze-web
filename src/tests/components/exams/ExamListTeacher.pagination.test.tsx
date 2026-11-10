import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExamListTeacher } from "@/components/exams/ExamListTeacher";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("@/services/exams.service", () => ({
  examsService: {
    listExams: vi.fn(),
    deleteExam: vi.fn(),
  },
}));

import { examsService } from "@/services/exams.service";

const buildExam = (index: number, status: "DRAFT" | "PUBLISHED" = "DRAFT") => ({
  id: `e${index}`,
  title: `Prova ${index}`,
  status,
  startsAt: "2026-06-01T10:00:00.000Z",
  endsAt: "2026-06-01T12:00:00.000Z",
  durationMinutes: 120,
  questionsCount: 2,
  totalPoints: 10,
  classes: [
    { id: "c1", name: "Turma A", subjectName: "Mat", courseName: "Eng" },
  ],
});

describe("ExamListTeacher - paginação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra 10 provas por página e navega para a próxima", async () => {
    vi.mocked(examsService.listExams).mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => buildExam(i + 1)),
    );
    const user = userEvent.setup();
    render(<ExamListTeacher />);

    await waitFor(() => screen.getByText("Prova 1"));
    expect(screen.getByText("Prova 10")).toBeInTheDocument();
    expect(screen.queryByText("Prova 11")).not.toBeInTheDocument();
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(screen.getByText("Prova 11")).toBeInTheDocument();
    expect(screen.getByText("Prova 12")).toBeInTheDocument();
    expect(screen.queryByText("Prova 1")).not.toBeInTheDocument();
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
  });

  it("volta para a página 1 ao trocar de aba", async () => {
    vi.mocked(examsService.listExams).mockResolvedValue([
      ...Array.from({ length: 12 }, (_, i) => buildExam(i + 1)),
      buildExam(13, "PUBLISHED"),
    ]);
    const user = userEvent.setup();
    render(<ExamListTeacher />);

    await waitFor(() => screen.getByText("Prova 1"));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Rascunho/i }));

    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("Prova 1")).toBeInTheDocument();
  });

  it("não mostra paginação quando tudo cabe em uma página", async () => {
    vi.mocked(examsService.listExams).mockResolvedValue([buildExam(1)]);
    render(<ExamListTeacher />);

    await waitFor(() => screen.getByText("Prova 1"));
    expect(
      screen.queryByRole("button", { name: "Próxima página" }),
    ).not.toBeInTheDocument();
  });
});