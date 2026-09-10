"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Excluir",
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[420px] rounded-lg bg-surface p-8 shadow-lg">
        <h2 className="mb-3 text-lg font-semibold text-foreground">{title}</h2>
        <p className="mb-6 text-sm text-muted">{message}</p>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-[18px] py-2.5 text-[13px] font-semibold text-foreground hover:bg-background"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="rounded-md bg-danger px-[18px] py-2.5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {confirming ? "Excluindo..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}