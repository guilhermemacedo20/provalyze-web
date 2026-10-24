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
      status: "NOT_STARTED" as const,
      score: null,
      durationMinutes: null,
    },
  ],
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
});
