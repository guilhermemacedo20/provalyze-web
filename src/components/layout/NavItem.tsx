import Link from "next/link";

type NavItemProps = {
  href: string;
  label: string;
  active?: boolean;
  variant?: "default" | "config";
};

export function NavItem({
  href,
  label,
  active = false,
  variant = "default",
}: NavItemProps) {
  const styles =
    variant === "config"
      ? "h-[35px] justify-center border border-foreground font-medium text-foreground"
      : active
        ? "bg-primary-light font-semibold text-primary"
        : "font-medium text-muted hover:bg-primary-light/60 hover:text-primary";

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-[8px] px-3 py-[9px] text-[14px] ${styles}`}
    >
      {label}
    </Link>
  );
}
