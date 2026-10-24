import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordChecks } from "@/components/auth/PasswordChecks";

describe("PasswordChecks", () => {
  it("mostra requisitos atendidos para senha forte", () => {
    render(<PasswordChecks password="Senha123" />);

    expect(screen.getByText("Mínimo de 8 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Uma letra maiúscula")).toBeInTheDocument();
    expect(screen.getByText("Um número")).toBeInTheDocument();
  });

  it("lista requisitos pendentes para senha fraca", () => {
    render(<PasswordChecks password="abc" />);

    expect(screen.getByText("Mínimo de 8 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Uma letra maiúscula")).toBeInTheDocument();
  });
});
