import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "@/components/auth/AuthProvider";
import EditExamPage from "@/app/exams/[id]/edit/page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "exam-edit" }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/exams/ExamWizard", () => ({
  ExamWizard: ({ examId }: { examId?: string }) => <div>Editar {examId}</div>,
}));

describe("EditExamPage", () => {
  it("abre wizard de edição para professor", () => {
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
      acceptTerms: vi.fn(),
    });

    render(<EditExamPage />);
    expect(screen.getByText("Editar exam-edit")).toBeInTheDocument();
  });
});
