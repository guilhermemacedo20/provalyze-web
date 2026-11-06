"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { TermsPolicyModal } from "@/components/ui/TermsPolicyModal";
import { extractErrorMessage } from "@/lib/extract-error-message";

type TermsAcceptanceModalProps = {
  onLogout: () => void;
};

export function TermsAcceptanceModal({ onLogout }: TermsAcceptanceModalProps) {
  const { acceptTerms } = useAuth();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [legalSection, setLegalSection] = useState<"terms" | "privacy" | null>(
    null,
  );

  async function handleAccept() {
    if (!checked || saving) return;
    setSaving(true);
    setError("");
    try {
      await acceptTerms();
    } catch (err) {
      setError(extractErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-acceptance-title"
      >
        <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl">
          <h2
            id="terms-acceptance-title"
            className="text-lg font-semibold text-foreground"
          >
            Termos de Uso e Política de Privacidade
          </h2>
          <p className="mt-2 text-sm text-muted">
            Para continuar usando o Provalyze, é necessário ler e aceitar os
            nossos termos.
          </p>

          <div className="mt-4 flex flex-col gap-1 text-sm">
            <button
              type="button"
              onClick={() => setLegalSection("terms")}
              className="w-fit font-medium text-primary hover:text-primary-hover hover:underline"
            >
              Ler os Termos de Uso
            </button>
            <button
              type="button"
              onClick={() => setLegalSection("privacy")}
              className="w-fit font-medium text-primary hover:text-primary-hover hover:underline"
            >
              Ler a Política de Privacidade
            </button>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>Li e aceito os Termos de Uso e a Política de Privacidade.</span>
          </label>

          {error && (
            <p className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onLogout}
              disabled={saving}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-60"
            >
              Sair
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={!checked || saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Aceitar e continuar"}
            </button>
          </div>
        </div>
      </div>

      <TermsPolicyModal
        open={legalSection !== null}
        section={legalSection ?? "terms"}
        onSectionChange={setLegalSection}
        onClose={() => setLegalSection(null)}
      />
    </>
  );
}