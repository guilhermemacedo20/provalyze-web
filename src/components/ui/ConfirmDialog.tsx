"use client";

import type { ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: ReactNode;
  error?: string | null;
  confirmLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  error,
  confirmLabel = "Excluir",
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 max-h-[85vh] w-full max-w-[460px] overflow-y-auto rounded-lg bg-surface p-8 shadow-lg">
        <h2 className="mb-3 break-words text-lg font-semibold text-foreground">
          {title}
        </h2>
        <div className="mb-3 break-words text-sm text-muted">{message}</div>
        {error && (
          <p className="mb-3 break-words text-[13px] text-danger">{error}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-md border border-border px-[18px] py-2.5 text-[13px] font-semibold text-foreground hover:bg-background"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="shrink-0 rounded-md bg-danger px-[18px] py-2.5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {confirming ? "Excluindo..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}