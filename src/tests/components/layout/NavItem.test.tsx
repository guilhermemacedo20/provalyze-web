import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { LayoutDashboard } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { NavItem } from "@/components/layout/NavItem";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("NavItem", () => {
  it("renderiza link ativo", () => {
    render(
      <NavItem
        href="/"
        label="Dashboard"
        icon={LayoutDashboard}
        active
      />,
    );

    const link = screen.getByRole("link", { name: /Dashboard/i });
    expect(link).toHaveAttribute("href", "/");
    expect(link.className).toContain("text-primary");
  });

  it("renderiza variante de configurações", () => {
    render(
      <NavItem
        href="/config"
        label="Configurações"
        icon={LayoutDashboard}
        variant="config"
      />,
    );

    expect(screen.getByRole("link").className).toContain("border");
  });
});
