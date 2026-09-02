import type { Role } from "@/lib/role";

export type NavItemConfig = {
  href: string;
  label: string;
  roles: Role[];
};

export const navItems: NavItemConfig[] = [
  {
    href: "/",
    label: "Dashboard",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    href: "/exams",
    label: "Exames",
    roles: ["TEACHER", "STUDENT"],
  },
  {
    href: "/questions",
    label: "Banco de Questões",
    roles: ["TEACHER"],
  },
  {
    href: "/classes",
    label: "Turmas",
    roles: ["TEACHER", "STUDENT"],
  },
  {
    href: "/analytics",
    label: "Analytics",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    href: "/gaps",
    label: "Lacunas",
    roles: ["TEACHER"],
  },
  {
    href: "/reports",
    label: "Relatórios",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    href: "/users",
    label: "Usuários",
    roles: ["ADMIN"],
  },
];

export const settingsItem: NavItemConfig = {
  href: "/config",
  label: "Configurações",
  roles: ["ADMIN", "TEACHER", "STUDENT"],
};

export function navItemsForRole(role: Role) {
  return navItems.filter((item) => item.roles.includes(role));
}

export function canAccessPath(pathname: string, role: Role) {
  const match = [...navItems, settingsItem].find((item) =>
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (!match) {
    return true;
  }
  return match.roles.includes(role);
}
