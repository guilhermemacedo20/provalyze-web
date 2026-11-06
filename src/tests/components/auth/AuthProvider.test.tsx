import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";

vi.mock("@/lib/auth-role-storage", () => ({
  getAccessToken: vi.fn(),
  getStoredUser: vi.fn(),
  saveSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock("@/services/auth.service", () => ({
  authService: {
    me: vi.fn(),
    login: vi.fn(),
  },
}));

import * as storage from "@/lib/auth-role-storage";
import { authService } from "@/services/auth.service";

function Probe() {
  const { user, loading, login, logout } = useAuth();
  if (loading) return <p>loading</p>;
  return (
    <div>
      <p>{user?.email ?? "guest"}</p>
      <button type="button" onClick={() => login("aluno@escola.com", "Senha123")}>
        login
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finaliza loading sem token", async () => {
    vi.mocked(storage.getAccessToken).mockReturnValue(null);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("guest")).toBeInTheDocument();
    });
    expect(storage.clearSession).toHaveBeenCalled();
  });

  it("faz login e logout", async () => {
    vi.mocked(storage.getAccessToken).mockReturnValue(null);
    const user = userEvent.setup();

    vi.mocked(authService.login).mockResolvedValue({
      accessToken: "token",
      user: {
        id: "1",
        name: "Ana",
        email: "aluno@escola.com",
        role: "STUDENT",
        classes: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText("guest")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() => expect(screen.getByText("aluno@escola.com")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "logout" }));
    expect(storage.clearSession).toHaveBeenCalled();
  });

  it("useAuth exige provider", () => {
    function Broken() {
      useAuth();
      return null;
    }

    expect(() => render(<Broken />)).toThrow(
      "useAuth precisa estar dentro de AuthProvider",
    );
  });

  it("restaura sessão com token válido", async () => {
    vi.mocked(storage.getAccessToken).mockReturnValue("token");
    vi.mocked(storage.getStoredUser).mockReturnValue({
      id: "1",
      name: "Ana",
      email: "aluno@escola.com",
      role: "STUDENT",
      classes: [],
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    vi.mocked(authService.me).mockResolvedValue({
      id: "1",
      name: "Ana",
      email: "aluno@escola.com",
      role: "STUDENT",
      classes: [],
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("aluno@escola.com")).toBeInTheDocument();
    });
    expect(storage.saveSession).toHaveBeenCalled();
  });
});
