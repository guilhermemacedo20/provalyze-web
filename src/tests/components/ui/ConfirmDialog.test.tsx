import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("ConfirmDialog", () => {
  it("não renderiza quando fechado", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Excluir"
        message="Confirma?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByText("Excluir")).not.toBeInTheDocument();
  });

  it("confirma e cancela quando aberto", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Excluir relatório"
        message="Esta ação não pode ser desfeita."
        error="Falhou"
        confirming
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText("Falhou")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluindo..." })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
