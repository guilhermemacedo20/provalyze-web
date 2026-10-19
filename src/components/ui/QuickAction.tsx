import Link from "next/link";

export function QuickAction({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[14px] bg-primary-light px-4 py-2.5 text-center text-[13px] font-semibold text-primary hover:bg-primary hover:text-white"
    >
      {children}
    </Link>
  );
}
