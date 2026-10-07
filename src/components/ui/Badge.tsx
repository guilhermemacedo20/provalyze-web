type BadgeTone =
  | "professor"
  | "aluno"
  | "admin"
  | "coordenador"
  | "success"
  | "neutral"
  | "warning"
  | "purple";

const TONE_STYLES: Record<BadgeTone, string> = {
  professor: "bg-[#e0e9fc] text-primary",
  aluno: "bg-[#efe8fe] text-[#8b5cf6]",
  admin: "bg-[#fef1dd] text-warning",
  coordenador: "bg-[#D8F5DD] text-[#3CAE63]",
  success: "bg-[#def2e6] text-success",
  neutral: "bg-[#eceff3] text-muted",
  warning: "bg-[#fef1dd] text-warning",
  purple: "bg-[#e6e1fb] text-[#6d5bd0]",
};

export function Badge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
