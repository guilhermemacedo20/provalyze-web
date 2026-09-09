"use client";

import { usePathname } from "next/navigation";
import { NavItem } from "./NavItem";
import {
  canAccessPath,
  isQuestionBankPath,
  navItemsForRole,
  settingsItem,
} from "@/config/nav";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Role } from "@/lib/auth-role-storage";

const publicPaths = ["/login"];

const isActive = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }
  if (href === "/questions") {
    return isQuestionBankPath(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

const roleLabel = (role: Role) => {
  if (role === "ADMIN") {
    return "Administrador(a)";
  }
  if (role === "STUDENT") {
    return "Aluno(a)";
  }
  return "Professor(a)";
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isPublic = publicPaths.includes(pathname);
  const role = user?.role ?? "STUDENT";
  const items = navItemsForRole(role);

  useEffect(() => {
    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }
    if (user && pathname === "/login") {
      router.replace("/");
      return;
    }
    if (user && !canAccessPath(pathname, user.role)) {
      router.replace("/");
    }
  }, [user, pathname, isPublic, router]);

  if (isPublic || !user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Provalyze" width={26} height={35} />
            <div className="flex flex-col">
              <p className="text-[18px] font-semibold text-primary">
                Provalyze
              </p>
              <p className="text-[12px] text-foreground">{roleLabel(role)}</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {items.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>

        <div className="px-3 pb-3">
          <NavItem
            href={settingsItem.href}
            label={settingsItem.label}
            icon={settingsItem.icon}
            variant="config"
          />
        </div>

        <div className="flex items-center gap-2.5 border-t border-border bg-disabled px-5 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-[10px] font-bold text-primary">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">
              {user.name}
            </p>
            <button
              type="button"
              className="cursor-pointer text-[11px] text-muted hover:text-foreground"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 bg-surface">{children}</div>
    </div>
  );
}
