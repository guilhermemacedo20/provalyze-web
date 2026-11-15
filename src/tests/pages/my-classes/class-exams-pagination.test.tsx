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

  it("pagina próximas avaliações e finalizadas de 10 em 10, de forma independente", async () => {
    vi.mocked(examsService.listClassExams).mockResolvedValue({
      classId: "c1",
      className: "Turma A",
      subjectName: "Matemática",
      courseName: "Engenharia",
      exams: [
        ...Array.from({ length: 12 }, (_, i) =>
          buildExam(`Futura ${i + 1}`, false),
        ),
        ...Array.from({ length: 11 }, (_, i) =>
          buildExam(`Antiga ${i + 1}`, true),
        ),
      ],
    });
    const user = userEvent.setup();
    render(<ClassExamsPage />);

    await waitFor(() => screen.getByText("Futura 1"));
    expect(screen.getByText("Futura 10")).toBeInTheDocument();
    expect(screen.queryByText("Futura 11")).not.toBeInTheDocument();
    expect(screen.getByText("Antiga 10")).toBeInTheDocument();
    expect(screen.queryByText("Antiga 11")).not.toBeInTheDocument();

    const upcomingNav = screen.getByRole("navigation", {
      name: "Paginação das próximas avaliações",
    });
    await user.click(
      within(upcomingNav).getByRole("button", { name: "Próxima página" }),
    );

    expect(screen.getByText("Futura 11")).toBeInTheDocument();
    expect(screen.getByText("Futura 12")).toBeInTheDocument();
    expect(screen.queryByText("Futura 1")).not.toBeInTheDocument();
    // a seção de finalizadas continua na página 1
    expect(screen.getByText("Antiga 1")).toBeInTheDocument();

    const finishedNav = screen.getByRole("navigation", {
      name: "Paginação das provas finalizadas",
    });
    await user.click(
      within(finishedNav).getByRole("button", { name: "Próxima página" }),
    );

    expect(screen.getByText("Antiga 11")).toBeInTheDocument();
    expect(screen.queryByText("Antiga 1")).not.toBeInTheDocument();
  });
});