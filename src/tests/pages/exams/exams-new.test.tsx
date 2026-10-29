import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "@/components/auth/AuthProvider";
import NewExamPage from "@/app/exams/new/page";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/exams/ExamWizard", () => ({
  ExamWizard: () => <div>Nova prova</div>,
}));

describe("NewExamPage", () => {
  it("mostra wizard para professor", () => {
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

    render(<NewExamPage />);
    expect(screen.getByText("Nova prova")).toBeInTheDocument();
  });

  it("não renderiza para outras roles", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "2",
        role: "STUDENT",
        name: "Aluno",
        email: "aluno@escola.com",
        classes: [],
        createdAt: "",
      },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      acceptTerms: vi.fn(),
    });

    const { container } = render(<NewExamPage />);
    expect(container).toBeEmptyDOMElement();
  });
});
