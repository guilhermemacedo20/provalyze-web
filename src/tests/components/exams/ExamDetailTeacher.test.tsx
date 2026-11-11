import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExamDetailTeacher } from "@/components/exams/ExamDetailTeacher";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/services/exams.service", () => ({
  examsService: {
    getExam: vi.fn(),
    getOverview: vi.fn(),
    publishExam: vi.fn(),
  },
}));

import { examsService } from "@/services/exams.service";

const examDetail = {
  id: "e1",
  title: "Prova A",
  status: "DRAFT" as const,
  startsAt: "2026-06-01T10:00:00.000Z",
  endsAt: "2026-06-02T10:00:00.000Z",
  durationMinutes: 60,
  autoSubmit: true,
  targetScore: 10,
  teacherName: "Prof",
  classes: [
    {
      id: "c1",
      name: "Turma A",
      subjectName: "Mat",
      courseName: "Eng",
      studentsCount: 5,
    },
  ],
  studentsCount: 5,
  questions: [
    {
      examQuestionId: "eq1",
      questionId: "q1",
      order: 0,
      points: 10,
      statement: "Questão",
      type: "MULTIPLE_CHOICE" as const,
      themeId: "t1",
      themeName: "Tema",
      correctRate: null,
    },
  ],
  totalPoints: 10,
};

const overview = {
  stats: {
    questionsCount: 1,
    studentsCount: 5,
    average: 8,
    completionRate: 40,
  },
  students: [
    {
      id: "s1",
      name: "Aluno",
      classId: "c1",
      className: "Turma A",
      status: "NOT_STARTED" as const,
      score: null,
      durationMinutes: null,
    },
  ],
  questions: [{ examQuestionId: "eq1", correctRate: null }],
};

describe("ExamDetailTeacher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(examsService.getExam).mockResolvedValue(examDetail);
    vi.mocked(examsService.getOverview).mockResolvedValue(overview);
  });

  it("mostra visão geral da prova em rascunho", async () => {
    render(<ExamDetailTeacher examId="e1" />);

    await waitFor(() => {
      expect(screen.getByText("Prova A")).toBeInTheDocument();
    });

    expect(screen.getByText("Rascunho")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Publicar prova/i })).toBeEnabled();
  });

  it("publica prova", async () => {
    vi.mocked(examsService.publishExam).mockResolvedValue({
      ...examDetail,
      status: "PUBLISHED",
    });
    const user = userEvent.setup();

    render(<ExamDetailTeacher examId="e1" />);
    await waitFor(() => screen.getByText("Prova A"));

    await user.click(screen.getByRole("button", { name: /Publicar prova/i }));
    expect(examsService.publishExam).toHaveBeenCalledWith("e1");
  });

  it("alterna para aba de questões", async () => {
    const user = userEvent.setup();
    render(<ExamDetailTeacher examId="e1" />);
    await waitFor(() => screen.getByText("Prova A"));

    await user.click(screen.getByRole("tab", { name: "Questões" }));
    expect(screen.getByText("Questão")).toBeInTheDocument();
  });

  it("filtra a prova pela turma escolhida", async () => {
    vi.mocked(examsService.getExam).mockResolvedValue({
      ...examDetail,
      classes: [
        ...examDetail.classes,
        {
          id: "c2",
          name: "Turma B",
          subjectName: "Mat",
          courseName: "Eng",
          studentsCount: 3,
        },
      ],
    });
    const user = userEvent.setup();
    render(<ExamDetailTeacher examId="e1" />);
    await waitFor(() => screen.getByText("Prova A"));

    await user.selectOptions(screen.getByLabelText("Turma"), "c2");

    await waitFor(() => {
      expect(examsService.getOverview).toHaveBeenLastCalledWith("e1", "c2");
    });
  });

  it("pagina a lista de alunos da visão geral", async () => {
    vi.mocked(examsService.getOverview).mockResolvedValue({
      ...overview,
      students: Array.from({ length: 12 }, (_, index) => ({
        id: `s${index + 1}`,
        name: `Aluno ${String(index + 1).padStart(2, "0")}`,
        classId: "c1",
        className: "Turma A",
        status: "NOT_STARTED" as const,
        score: null,
        durationMinutes: null,
      })),
    });
    const user = userEvent.setup();

    render(<ExamDetailTeacher examId="e1" />);

    expect(await screen.findByText("Aluno 01")).toBeInTheDocument();
    expect(screen.getByText("Aluno 10")).toBeInTheDocument();
    expect(screen.queryByText("Aluno 11")).not.toBeInTheDocument();
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(screen.getByText("Aluno 11")).toBeInTheDocument();
    expect(screen.getByText("Aluno 12")).toBeInTheDocument();
    expect(screen.queryByText("Aluno 01")).not.toBeInTheDocument();
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
  });

  it("não mostra a paginação quando cabe em uma página", async () => {
    render(<ExamDetailTeacher examId="e1" />);
    await waitFor(() => screen.getByText("Prova A"));

    expect(
      screen.queryByRole("navigation", { name: "Paginação dos alunos" }),
    ).not.toBeInTheDocument();
  });
});