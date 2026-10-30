import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@/components/auth/AuthProvider";
import UsersPage from "@/app/users/page";
import { usersService } from "@/services/users.service";
import type { Role } from "@/lib/role";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/users.service", () => ({
  usersService: {
    listUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

function loginAs(role: Role) {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      id: "me",
      role,
      name: "Eu",
      email: "eu@escola.com",
      classes: [],
      createdAt: "",
    },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    acceptTerms: vi.fn(),
  });
}

function buildUser(id: string, name: string, role: Role) {
  return {
    id,
    name,
    email: `${id}@escola.com`,
    role,
    classes: [],
    createdAt: "01/01/2026",
  };
}

function userNames() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent);
}

describe("UsersPage", () => {
  beforeEach(() => {
    loginAs("ADMIN");
  });

  it("pagina os usuários de 20 em 20", async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.listUsers).mockResolvedValue(
      Array.from({ length: 45 }, (_, index) =>
        buildUser(`u${index + 1}`, `Usuário ${String(index + 1).padStart(2, "0")}`, "STUDENT"),
      ),
    );

    render(<UsersPage />);

    await waitFor(() => expect(userNames()).toHaveLength(20));
    expect(userNames()[0]).toBe("Usuário 01");
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todos (45)" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(userNames()).toHaveLength(5);
    expect(userNames()[0]).toBe("Usuário 41");
  });

  it("volta para a página 1 ao trocar de aba", async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.listUsers).mockResolvedValue([
      ...Array.from({ length: 25 }, (_, index) =>
        buildUser(`a${index + 1}`, `Aluno ${String(index + 1).padStart(2, "0")}`, "STUDENT"),
      ),
      buildUser("p1", "Professora Rita", "TEACHER"),
    ]);

    render(<UsersPage />);

    await waitFor(() => expect(userNames()).toHaveLength(20));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Professores (1)" }));

    expect(userNames()).toEqual(["Professora Rita"]);
    expect(
      screen.queryByRole("navigation", { name: "Paginação dos usuários" }),
    ).not.toBeInTheDocument();
  });

  it("busca por nome ou e-mail sem diferenciar acento", async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.listUsers).mockResolvedValue([
      ...Array.from({ length: 25 }, (_, index) =>
        buildUser(`a${index + 1}`, `Aluno ${String(index + 1).padStart(2, "0")}`, "STUDENT"),
      ),
      buildUser("jose", "José Álvares", "TEACHER"),
    ]);

    render(<UsersPage />);

    await waitFor(() => expect(userNames()).toHaveLength(20));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    await user.type(screen.getByPlaceholderText("Pesquisar..."), "jose alvares");

    expect(userNames()).toEqual(["José Álvares"]);
  });

  it("coordenador só vê professores e alunos, também paginados", async () => {
    loginAs("COORDINATOR");
    const user = userEvent.setup();
    vi.mocked(usersService.listUsers).mockResolvedValue([
      ...Array.from({ length: 21 }, (_, index) =>
        buildUser(`a${index + 1}`, `Aluno ${String(index + 1).padStart(2, "0")}`, "STUDENT"),
      ),
      buildUser("adm", "Admin Geral", "ADMIN"),
      buildUser("coord", "Outro Coordenador", "COORDINATOR"),
    ]);

    render(<UsersPage />);

    await waitFor(() => expect(userNames()).toHaveLength(20));
    expect(screen.getByRole("button", { name: "Todos (21)" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Administradores/ }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(userNames()).toEqual(["Aluno 21"]);
  });
});