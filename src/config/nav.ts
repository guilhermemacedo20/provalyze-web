import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  GraduationCap,
  Layers,
  School,
  BarChart3,
  Target,
  FileBarChart,
  Settings,
} from "lucide-react";
import type { Role } from "@/lib/role";

export type NavItemConfig = {
  href: string;
  label: string;
  roles: Role[];
  icon: LucideIcon;
};

export const navItems: NavItemConfig[] = [
  {
    href: "/",
    label: "Dashboard",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    icon: LayoutDashboard,
  },
  {
    href: "/users",
    label: "Usuários",
    roles: ["ADMIN"],
    icon: Users,
  },
  {
    href: "/exams",
    label: "Exames",
    roles: ["TEACHER", "STUDENT"],
    icon: FileText,
  },
  {
    href: "/questions",
    label: "Banco de Questões",
    roles: ["TEACHER"],
    icon: BookOpen,
  },
  {
    href: "/classes",
    label: "Turmas",
    roles: ["TEACHER", "STUDENT"],
    icon: GraduationCap,
  },
  {
    href: "/courses",
    label: "Cursos",
    roles: ["ADMIN"],
    icon: Layers,
  },
  {
    href: "/classes-admin",
    label: "Turmas",
    roles: ["ADMIN"],
    icon: School,
  },
  {
    href: "/analytics",
    label: "Analytics",
    roles: ["TEACHER", "ADMIN"],
    icon: BarChart3,
  },
  {
    href: "/gaps",
    label: "Lacunas",
    roles: ["TEACHER"],
    icon: Target,
  },
  {
    href: "/reports",
    label: "Relatórios",
    roles: ["TEACHER", "ADMIN"],
    icon: FileBarChart,
  },
];

export const settingsItem: NavItemConfig = {
  href: "/config",
  label: "Configurações",
  roles: ["ADMIN", "TEACHER", "STUDENT"],
  icon: Settings,
};

export function navItemsForRole(role: Role) {
  return navItems.filter((item) => item.roles.includes(role));
}

export function isQuestionBankPath(pathname: string) {
  return (
    pathname === "/questions" ||
    pathname.startsWith("/questions/") ||
    pathname === "/themes" ||
    pathname.startsWith("/themes/")
  );
}

export function canAccessPath(pathname: string, role: Role) {
  if (isQuestionBankPath(pathname)) {
    return role === "TEACHER";
  }

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