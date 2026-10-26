import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StudentExamsPlaceholder } from "@/components/exams/StudentExamsPlaceholder";

describe("StudentExamsPlaceholder", () => {
  it("informa área do aluno em construção", () => {
    render(<StudentExamsPlaceholder />);
    expect(screen.getByRole("heading", { name: "Provas" })).toBeInTheDocument();
    expect(screen.getByText(/em construção/i)).toBeInTheDocument();
  });
});
