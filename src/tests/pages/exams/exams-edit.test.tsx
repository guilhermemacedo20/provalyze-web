import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "@/components/auth/AuthProvider";
import ExamDetailPage from "@/app/exams/[id]/page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "exam-1" }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/exams/ExamDetailTeacher", () => ({
  ExamDetailTeacher: ({ examId }: { examId: string }) => (
    <div>Detalhe {examId}</div>
  ),
}));

vi.mock("@/components/exams/StudentExamsPlaceholder", () => ({
  StudentExamsPlaceholder: () => <div>Placeholder aluno</div>,
}));

describe("ExamDetailPage", () => {
  it("passa id para detalhe do professor", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "1",
        role: "TEACHER",
        name: "Prof",
        email: "professor@escola.com",
        classes: [],
        createdAt: "",
      },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<ExamDetailPage />);
    expect(screen.getByText("Detalhe exam-1")).toBeInTheDocument();
  });
});
