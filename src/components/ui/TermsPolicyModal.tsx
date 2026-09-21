"use client";

import { X } from "lucide-react";

type Section = "terms" | "privacy";

type TermsPolicyModalProps = {
  open: boolean;
  section: Section;
  onSectionChange: (section: Section) => void;
  onClose: () => void;
};

export function TermsPolicyModal({
  open,
  section,
  onSectionChange,
  onClose,
}: TermsPolicyModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="relative w-full max-w-[560px] rounded-lg border border-border bg-surface p-8 shadow-sm">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-foreground"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="mb-6 flex gap-1 rounded-md border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => onSectionChange("terms")}
            className={`flex-1 rounded-sm py-2 text-[13px] font-medium transition-colors ${
              section === "terms"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Termos de Uso
          </button>
          <button
            type="button"
            onClick={() => onSectionChange("privacy")}
            className={`flex-1 rounded-sm py-2 text-[13px] font-medium transition-colors ${
              section === "privacy"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Política de Privacidade
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto pr-1 text-sm leading-relaxed text-muted">
          {section === "terms" ? (
            <p>Texto dos Termos de Uso — em breve.</p>
          ) : (
            <p>Texto da Política de Privacidade — em breve.</p>
          )}
        </div>
      </div>
    </div>
  );
}