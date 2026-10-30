import { ExamStart } from "@/app/my-exams/[classId]/[examId]/exam-start";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

function renderStart(
  overrides: Partial<Parameters<typeof ExamStart>[0]> = {},
) {
  const onStart = vi.fn();

  render(
    <ExamStart
      title="Prova 1"
      courseName="Engenharia"
      subjectName="Matemática"
      durationMinutes={60}
      available
      continuing={false}
      starting={false}
      message=""
      error={null}
      backHref="/my-classes/c1"
      onStart={onStart}
      {...overrides}
    />,
  );

  return { onStart };
}

describe("ExamStart", () => {
  it("mantém o botão desabilitado até marcar que está ciente", async () => {
    const user = userEvent.setup();
    const { onStart } = renderStart();

    const button = screen.getByRole("button", { name: "Iniciar prova" });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onStart).not.toHaveBeenCalled();

    await user.click(screen.getByRole("checkbox", { name: /Estou ciente/ }));
    expect(button).toBeEnabled();

    await user.click(button);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("desabilita o botão de novo ao desmarcar a ciência", async () => {
    const user = userEvent.setup();
    renderStart();

    const checkbox = screen.getByRole("checkbox", { name: /Estou ciente/ });
    await user.click(checkbox);
    expect(screen.getByRole("button", { name: "Iniciar prova" })).toBeEnabled();

    await user.click(checkbox);
    expect(
      screen.getByRole("button", { name: "Iniciar prova" }),
    ).toBeDisabled();
  });

  it("lista o que fica registrado na tentativa", () => {
    renderStart();

    expect(screen.getByText("O que fica registrado")).toBeInTheDocument();
    for (const label of [
      "Troca de aba",
      "Perda de foco",
      "Copiar",
      "Colar",
      "Recortar",
      "Menu de contexto",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("mostra Continuar prova quando a prova já foi iniciada", async () => {
    const user = userEvent.setup();
    renderStart({ continuing: true });

    const button = screen.getByRole("button", { name: "Continuar prova" });
    expect(button).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /Estou ciente/ }));
    expect(button).toBeEnabled();
  });

  it("mantém o botão desabilitado enquanto carrega, mesmo com a ciência marcada", async () => {
    const user = userEvent.setup();
    renderStart({ starting: true });

    await user.click(screen.getByRole("checkbox", { name: /Estou ciente/ }));

    expect(screen.getByRole("button", { name: "Carregando..." })).toBeDisabled();
  });

  it("mostra só a mensagem quando a prova está indisponível", () => {
    renderStart({
      available: false,
      message: "O prazo para realizar a prova acabou.",
    });

    expect(
      screen.getByText("O prazo para realizar a prova acabou."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});