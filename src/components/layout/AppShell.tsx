"use client";

import { usePathname } from "next/navigation";
import { NavItem } from "./NavItem";
import { canAccessPath, navItemsForRole, settingsItem } from "@/config/nav";
import { getCurrentRole } from "@/lib/role";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function roleLabel(role: ReturnType<typeof getCurrentRole>) {
  if (role === "ADMIN") {
    return "Administrador(a)";
  }
  if (role === "STUDENT") {
    return "Aluno(a)";
  }
  return "Professor(a)";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = getCurrentRole();
  const items = navItemsForRole(role);
  const router = useRouter();

  useEffect(() => {
    if (!canAccessPath(pathname, role)) {
      router.push("/");
    }
  }, [pathname, role]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="border-b border-border px-5 py-5">
          <p className="text-[18px] font-semibold text-primary">Provalyze</p>
          <p className="mt-1 text-[12px] text-foreground">{roleLabel(role)}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {items.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>

        <div className="px-3 pb-3">
          <NavItem
            href={settingsItem.href}
            label={settingsItem.label}
            variant="config"
          />
        </div>

        <div className="flex items-center gap-2.5 border-t border-border bg-disabled px-5 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-[10px] font-bold text-primary">
            {role.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">
              {role === "TEACHER"
                ? "Professor"
                : role === "ADMIN"
                  ? "Admin"
                  : "Aluno"}
            </p>
            <button type="button" className="text-[11px] text-muted">
              Sair
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 bg-surface">{children}</div>
    </div>
  );
}
