type BadgeTone = "professor" | "aluno" | "admin" | "success";

const TONE_STYLES: Record<BadgeTone, string> = {
  professor: "bg-[#e0e9fc] text-primary",
  aluno: "bg-[#efe8fe] text-[#8b5cf6]",
  admin: "bg-[#fef1dd] text-warning",
  success: "bg-[#def2e6] text-success",
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