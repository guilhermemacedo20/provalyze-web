import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JoinRequestsPanel } from "@/components/classes/JoinRequestsPanel";

vi.mock("@/services/classes.service", () => ({
  classesService: {
    listJoinRequests: vi.fn(),
    approveJoinRequests: vi.fn(),
    rejectJoinRequests: vi.fn(),
  },
}));

import { classesService } from "@/services/classes.service";

const buildRequest = (id: string, name: string) => ({
  id,
  createdAt: "2026-11-14T12:00:00.000Z",
  student: { id: `s-${id}`, name, email: `${id}@escola.edu.br` },
});

const REQUESTS = [
  buildRequest("r1", "Ana"),
  buildRequest("r2", "Bruno"),
  buildRequest("r3", "Carla"),
];

describe("JoinRequestsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não aparece quando não há solicitações pendentes", async () => {
    vi.mocked(classesService.listJoinRequests).mockResolvedValue([]);
    const { container } = render(<JoinRequestsPanel classId="c1" />);

    await waitFor(() => {
      expect(classesService.listJoinRequests).toHaveBeenCalledWith("c1");
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("lista as solicitações e mantém os botões desabilitados sem seleção", async () => {
    vi.mocked(classesService.listJoinRequests).mockResolvedValue(REQUESTS);
    render(<JoinRequestsPanel classId="c1" />);

    await waitFor(() => screen.getByText("Ana"));
    expect(
      screen.getByText("Solicitações de entrada (3)"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 selecionados")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Aprovar selecionados" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Recusar selecionados" }),
    ).toBeDisabled();
  });

  it("marca todos de uma vez e aprova em lote", async () => {
    vi.mocked(classesService.listJoinRequests)
      .mockResolvedValueOnce(REQUESTS)
      .mockResolvedValueOnce([]);
    vi.mocked(classesService.approveJoinRequests).mockResolvedValue({
      approved: 3,
    });
    const onApproved = vi.fn();
    const user = userEvent.setup();
    render(<JoinRequestsPanel classId="c1" onApproved={onApproved} />);

    await waitFor(() => screen.getByText("Ana"));
    await user.click(screen.getByRole("checkbox", { name: "Selecionar todos" }));

    expect(screen.getByText("3 selecionados")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Selecionar Bruno" })).toBeChecked();

    await user.click(
      screen.getByRole("button", { name: "Aprovar selecionados" }),
    );

    expect(classesService.approveJoinRequests).toHaveBeenCalledWith("c1", [
      "r1",
      "r2",
      "r3",
    ]);
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("3 alunos aprovados.");
    });
    expect(onApproved).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
  });

  it("desmarca todos ao clicar de novo em Selecionar todos", async () => {
    vi.mocked(classesService.listJoinRequests).mockResolvedValue(REQUESTS);
    const user = userEvent.setup();
    render(<JoinRequestsPanel classId="c1" />);

    await waitFor(() => screen.getByText("Ana"));
    const selectAll = screen.getByRole("checkbox", { name: "Selecionar todos" });
    await user.click(selectAll);
    await user.click(selectAll);

    expect(screen.getByText("0 selecionados")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Selecionar Ana" })).not.toBeChecked();
  });

  it("recusa só as solicitações escolhidas", async () => {
    vi.mocked(classesService.listJoinRequests)
      .mockResolvedValueOnce(REQUESTS)
      .mockResolvedValueOnce([REQUESTS[1]]);
    vi.mocked(classesService.rejectJoinRequests).mockResolvedValue({
      rejected: 2,
    });
    const onApproved = vi.fn();
    const user = userEvent.setup();
    render(<JoinRequestsPanel classId="c1" onApproved={onApproved} />);

    await waitFor(() => screen.getByText("Ana"));
    await user.click(screen.getByRole("checkbox", { name: "Selecionar Ana" }));
    await user.click(screen.getByRole("checkbox", { name: "Selecionar Carla" }));
    expect(screen.getByText("2 selecionados")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Recusar selecionados" }),
    );

    expect(classesService.rejectJoinRequests).toHaveBeenCalledWith("c1", [
      "r1",
      "r3",
    ]);
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "2 solicitações recusadas.",
      );
    });
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(onApproved).not.toHaveBeenCalled();
  });

  it("mostra o erro e mantém a seleção quando a aprovação falha", async () => {
    vi.mocked(classesService.listJoinRequests).mockResolvedValue(REQUESTS);
    vi.mocked(classesService.approveJoinRequests).mockRejectedValue(
      new Error(JSON.stringify({ message: "Nenhuma solicitação pendente encontrada" })),
    );
    const user = userEvent.setup();
    render(<JoinRequestsPanel classId="c1" />);

    await waitFor(() => screen.getByText("Ana"));
    await user.click(screen.getByRole("checkbox", { name: "Selecionar Ana" }));
    await user.click(
      screen.getByRole("button", { name: "Aprovar selecionados" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma solicitação pendente encontrada"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("1 selecionado")).toBeInTheDocument();
  });
});