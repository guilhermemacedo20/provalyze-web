import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExamListTeacher } from "@/components/exams/ExamListTeacher";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => <a href={href}>{children}</a>,
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

const sampleExam = {
  id: "e1",
  title: "Prova 1",
  status: "DRAFT" as const,
  startsAt: "2026-06-01T10:00:00.000Z",
  endsAt: "2026-06-01T12:00:00.000Z",
  durationMinutes: 120,
  questionsCount: 2,
  totalPoints: 10,
  classes: [
    {
      id: "c1",
      name: "Turma A",
      subjectName: "Mat",
      courseName: "Eng",
    },
  ],
};

describe("ExamListTeacher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista provas e filtra por aba", async () => {
    vi.mocked(examsService.listExams).mockResolvedValue([
      sampleExam,
      { ...sampleExam, id: "e2", title: "Prova 2", status: "PUBLISHED" },
    ]);

    const user = userEvent.setup();
    render(<ExamListTeacher />);

    await waitFor(() => {
      expect(screen.getByText("Prova 1")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: /Rascunho/i }));
    expect(screen.getByText("Prova 1")).toBeInTheDocument();
    expect(screen.queryByText("Prova 2")).not.toBeInTheDocument();
  });

  it("abre confirmação de exclusão", async () => {
    vi.mocked(examsService.listExams).mockResolvedValue([sampleExam]);
    const user = userEvent.setup();

    render(<ExamListTeacher />);
    await waitFor(() => screen.getByText("Prova 1"));

    await user.click(
      screen.getByRole("button", { name: "Excluir prova Prova 1" }),
    );
    expect(screen.getByText("Excluir prova")).toBeInTheDocument();
  });
});
