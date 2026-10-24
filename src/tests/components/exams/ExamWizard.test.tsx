import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExamWizard } from "@/components/exams/ExamWizard";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/services/classes.service", () => ({
  classesService: { listClasses: vi.fn() },
}));

vi.mock("@/services/exams.service", () => ({
  examsService: {
    getExam: vi.fn(),
    createExam: vi.fn(),
    updateExam: vi.fn(),
  },
}));

import { classesService } from "@/services/classes.service";
import { examsService } from "@/services/exams.service";

describe("ExamWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(classesService.listClasses).mockResolvedValue([
      {
        id: "c1",
        name: "Turma A",
        joinCode: "abc",
        teacherName: "Prof",
        subjectName: "Mat",
        courseName: "Eng",
        studentsCount: 3,
        averageScore: null,
      },
    ]);
  });

  it("valida etapa 1 antes de avançar", async () => {
    const user = userEvent.setup();
    render(<ExamWizard />);

    await waitFor(() => {
      expect(screen.getByText("Informações")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /Próximo: Questões/i }),
    );
    expect(screen.getByText(/Informe o nome da prova/i)).toBeInTheDocument();
  });

  it("preenche informações básicas e avança para questões", async () => {
    const user = userEvent.setup();
    render(<ExamWizard />);

    await waitFor(() => screen.getByLabelText(/Nome da prova/i));

    await user.type(screen.getByLabelText(/Nome da prova/i), "Prova nova");
    await user.type(
      screen.getByLabelText(/Data\/hora inicial/i),
      "2026-12-01T10:00",
    );
    await user.type(
      screen.getByLabelText(/Data\/hora final/i),
      "2026-12-01T12:00",
    );
    await user.type(screen.getByLabelText(/Tempo de prova/i), "01:00");

    await user.click(
      screen.getByRole("button", { name: /Próximo: Questões/i }),
    );

    expect(
      screen.getByText(/Escolha o tema para ver as questões/i),
    ).toBeInTheDocument();
  });

  it("carrega rascunho existente na edição", async () => {
    vi.mocked(examsService.getExam).mockResolvedValue({
      id: "e1",
      title: "Prova editável",
      status: "DRAFT",
      startsAt: "2026-06-01T10:00:00.000Z",
      endsAt: "2026-06-01T12:00:00.000Z",
      durationMinutes: 60,
      targetScore: 10,
      teacherName: "Prof",
      classes: [{ id: "c1", name: "Turma", subjectName: "Mat", courseName: "Eng", studentsCount: 1 }],
      studentsCount: 1,
      questions: [],
      totalPoints: 0,
    });

    render(<ExamWizard examId="e1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Prova editável")).toBeInTheDocument();
    });
  });
});
