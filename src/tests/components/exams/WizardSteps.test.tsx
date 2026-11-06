import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WizardSteps } from "@/components/exams/WizardSteps";

describe("WizardSteps", () => {
  it("destaca etapa atual do wizard", () => {
    render(<WizardSteps current={2} />);
    expect(screen.getByText("Questões")).toBeInTheDocument();
    expect(screen.getByLabelText("Etapas da prova")).toBeInTheDocument();
    expect(screen.getByText("Informações")).toBeInTheDocument();
    expect(screen.getByText("Revisão")).toBeInTheDocument();
  });
});
