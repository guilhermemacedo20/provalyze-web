"use client";

import { useState } from "react";
import { TermsPolicyModal } from "@/components/ui/TermsPolicyModal";

export function LegalFooter() {
  const [section, setSection] = useState<"terms" | "privacy" | null>(null);

  const linkClass =
    "cursor-pointer text-[12px] font-medium text-muted hover:text-primary hover:underline";

  return (
    <>
      <footer className="mt-auto flex justify-end gap-4 pt-10">
        <button
          type="button"
          onClick={() => setSection("terms")}
          className={linkClass}
        >
          Termos de Uso
        </button>
        <button
          type="button"
          onClick={() => setSection("privacy")}
          className={linkClass}
        >
          Política de Privacidade
        </button>
      </footer>

      <TermsPolicyModal
        open={section !== null}
        section={section ?? "terms"}
        onSectionChange={setSection}
        onClose={() => setSection(null)}
      />
    </>
  );
}