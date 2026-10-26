import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/AppShell";

const replace = vi.fn();
const logout = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useRouter: () => ({ replace }),
}));

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

describe("AppShell", () => {
  it("renderiza conteúdo em rota pública sem menu", () => {
    vi.mocked(usePathname).mockReturnValue("/login");
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      logout,
    });

    render(
      <AppShell>
        <p>Login page</p>
      </AppShell>,
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Provalyze")).not.toBeInTheDocument();
  });

  it("mostra menu lateral para professor autenticado", async () => {
    vi.mocked(usePathname).mockReturnValue("/exams");
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "1",
        name: "Prof",
        email: "professor@escola.com",
        role: "TEACHER",
        classes: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      loading: false,
      login: vi.fn(),
      logout,
    });

    const user = userEvent.setup();

    render(
      <AppShell>
        <p>Conteúdo</p>
      </AppShell>,
    );

    expect(screen.getByText("Provalyze")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Provas/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sair" }));
    expect(logout).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
