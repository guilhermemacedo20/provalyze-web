import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PerformancePanel } from "@/components/dashboard/PerformancePanel";
import type { DashboardStats } from "@/services/report.service";

const getDashboard = vi.fn();

vi.mock("@/services/report.service", () => ({
  reportService: { getDashboard: (filter: unknown) => getDashboard(filter) },
}));

const outcomes = { correct: 6, wrong: 3, pending: 0 };

const teacher: DashboardStats = {
  role: "TEACHER",
  totalExams: 2,
  totalAverage: 7.2,
  hitRate: 60,
  classes: [{ id: "c1", name: "Turma A", subjectName: "Eng. Software" }],
  pendingSubmissions: 0,
  answers: outcomes,
  scoresByExam: [{ examId: "e1", title: "Prova 1", average: 7.2 }],
  questionsByExam: [
    {
      examId: "e1",
      title: "Prova 1",
      answers: outcomes,
      questions: [{ number: 1, theme: "Lógica", ...outcomes }],
    },
  ],
  timeline: [{ label: "05/10", submissions: 5 }],
};

const student: DashboardStats = {
  ...teacher,
  role: "STUDENT",
  upcomingExams: 3,
  finishedExams: 0,
  totalAverage: null,
  hitRate: null,
  scoresByExam: [],
  questionsByExam: [],
  timeline: [],
};

describe("PerformancePanel", () => {
  beforeAll(() => {
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    getDashboard.mockReset();
    getDashboard.mockResolvedValue(teacher);
  });

  it("carrega o mês atual e mostra o resumo do período", async () => {
    render(<PerformancePanel audience="teacher" />);

    expect(await screen.findByText("7,2")).toBeInTheDocument();
    expect(getDashboard).toHaveBeenCalledWith(expect.objectContaining({ period: "month" }));
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("Média das notas por prova")).toBeInTheDocument();
  });

  it("abre a pizza com todas as provas e permite escolher prova e questão", async () => {
    const user = userEvent.setup();
    render(<PerformancePanel audience="teacher" />);

    const exam = await screen.findByRole("combobox", { name: "Prova" });
    expect(exam).toHaveValue("");
    expect(screen.queryByRole("combobox", { name: "Questão" })).not.toBeInTheDocument();

    await user.selectOptions(exam, "e1");
    expect(screen.getByRole("combobox", { name: "Questão" })).toBeInTheDocument();
  });

  it("refaz a busca ao trocar período e turma", async () => {
    const user = userEvent.setup();
    render(<PerformancePanel audience="teacher" />);
    await waitFor(() => expect(screen.getByRole("radio", { name: "Total" })).toBeEnabled());

    await user.click(screen.getByRole("radio", { name: "Total" }));
    await waitFor(() => expect(getDashboard).toHaveBeenLastCalledWith(expect.objectContaining({ period: "all" })));

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Turma" })).toBeEnabled());
    await user.selectOptions(screen.getByRole("combobox", { name: "Turma" }), "c1");
    await waitFor(() =>
      expect(getDashboard).toHaveBeenLastCalledWith(expect.objectContaining({ period: "all", classId: "c1" })),
    );
  });

  it("aluno vê próximas provas e a mensagem do período sem entregas", async () => {
    getDashboard.mockResolvedValue(student);
    render(<PerformancePanel audience="student" />);

    await waitFor(() => expect(screen.getAllByText("Nenhuma prova entregue nesse período").length).toBe(3));
    expect(screen.getByText("Meu desempenho")).toBeInTheDocument();
    expect(screen.getByText("Próximas provas")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Questão" })).not.toBeInTheDocument();
  });
});
