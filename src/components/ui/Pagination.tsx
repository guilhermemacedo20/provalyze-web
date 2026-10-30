import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  onPageChange,
  label = "Paginação",
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={label}
      className="flex items-center justify-center gap-3 py-2"
    >
      <button
        type="button"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-[13px] text-muted">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        aria-label="Próxima página"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}