import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClassExamsPage from "@/app/my-classes/[classId]/page";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ classId: "c1" }),
}));

vi.mock("@/services/exams.service", () => ({
  examsService: {
    listClassExams: vi.fn(),
  },
}));

import { examsService } from "@/services/exams.service";

const buildExam = (title: string, finished: boolean) => ({
  id: title,
  classId: "c1",
  className: "Turma A",
  subjectName: "Matemática",
  courseName: "Engenharia",
  title,
  startsAt: "2026-06-01T10:00:00.000Z",
  endsAt: "2026-06-01T12:00:00.000Z",
  targetScore: 10,
  durationMinutes: 120,
  status: finished ? "ENDED" : "PUBLISHED",
  sessionStatus: null,
  score: null,
  available: !finished,
  finished,
  message: null,
});

describe("ClassExamsPage - paginação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pagina próximas avaliações e finalizadas de forma independente", async () => {
    vi.mocked(examsService.listClassExams).mockResolvedValue({
      classId: "c1",
      className: "Turma A",
      subjectName: "Matemática",
      courseName: "Engenharia",
      exams: [
        ...Array.from({ length: 7 }, (_, i) => buildExam(`Futura ${i + 1}`, false)),
        ...Array.from({ length: 6 }, (_, i) => buildExam(`Antiga ${i + 1}`, true)),
      ],
    });
    const user = userEvent.setup();
    render(<ClassExamsPage />);

    await waitFor(() => screen.getByText("Futura 1"));
    expect(screen.getByText("Futura 5")).toBeInTheDocument();
    expect(screen.queryByText("Futura 6")).not.toBeInTheDocument();
    expect(screen.getByText("Antiga 5")).toBeInTheDocument();
    expect(screen.queryByText("Antiga 6")).not.toBeInTheDocument();

    const upcomingNav = screen.getByRole("navigation", {
      name: "Paginação das próximas avaliações",
    });
    await user.click(
      within(upcomingNav).getByRole("button", { name: "Próxima página" }),
    );

    expect(screen.getByText("Futura 6")).toBeInTheDocument();
    expect(screen.getByText("Futura 7")).toBeInTheDocument();
    expect(screen.queryByText("Futura 1")).not.toBeInTheDocument();
    // a seção de finalizadas continua na página 1
    expect(screen.getByText("Antiga 1")).toBeInTheDocument();

    const finishedNav = screen.getByRole("navigation", {
      name: "Paginação das provas finalizadas",
    });
    await user.click(
      within(finishedNav).getByRole("button", { name: "Próxima página" }),
    );

    expect(screen.getByText("Antiga 6")).toBeInTheDocument();
    expect(screen.queryByText("Antiga 1")).not.toBeInTheDocument();
  });
});