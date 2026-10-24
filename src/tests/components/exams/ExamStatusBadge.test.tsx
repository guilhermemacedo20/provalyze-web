import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExamStatusBadge, StudentStatusBadge } from "@/components/exams/ExamStatusBadge";

describe("ExamStatusBadge", () => {
  it("mostra rótulos de prova e aluno", () => {
    render(<ExamStatusBadge status="PUBLISHED" />);
    expect(screen.getByText("Publicada")).toBeInTheDocument();

    render(<StudentStatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
  });
});
