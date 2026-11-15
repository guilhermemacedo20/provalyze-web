import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MyClassesPage from "@/app/my-classes/page";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/services/classes.service", () => ({
  classesService: {
    listStudentClasses: vi.fn(),
    joinClass: vi.fn(),
    hideClass: vi.fn(),
    unhideClass: vi.fn(),
  },
}));

import { classesService } from "@/services/classes.service";

describe("MyClassesPage - entrar com código", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(classesService.listStudentClasses).mockResolvedValue([]);
  });

  it("avisa que a solicitação foi enviada e aguarda o professor", async () => {
    vi.mocked(classesService.joinClass).mockResolvedValue({
      status: "PENDING",
    });
    const user = userEvent.setup();
    render(<MyClassesPage />);

    await waitFor(() => screen.getByText("Sem classes encontradas"));
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await user.type(screen.getByPlaceholderText("Código"), "ABC12345");
    const buttons = screen.getAllByRole("button", { name: "Entrar" });
    await user.click(buttons[buttons.length - 1]);

    expect(classesService.joinClass).toHaveBeenCalledWith("ABC12345");
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /Solicitação enviada/,
      );
    });
  });

  it("mostra o erro do servidor quando já existe uma solicitação pendente", async () => {
    vi.mocked(classesService.joinClass).mockRejectedValue(
      new Error(
        JSON.stringify({
          message:
            "Você já solicitou entrada nessa turma. Aguarde a aprovação do professor.",
        }),
      ),
    );
    const user = userEvent.setup();
    render(<MyClassesPage />);

    await waitFor(() => screen.getByText("Sem classes encontradas"));
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await user.type(screen.getByPlaceholderText("Código"), "ABC12345");
    const buttons = screen.getAllByRole("button", { name: "Entrar" });
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(
        screen.getByText(/Você já solicitou entrada nessa turma/),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});