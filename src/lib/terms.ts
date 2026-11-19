"use client";

import { useEffect, useState } from "react";
import { authService } from "@/services/auth.service";

export function useTermsVersion() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    authService
      .terms()
      .then((result) => {
        if (active) setVersion(result.version);
      })
      .catch(() => {
        if (active) setVersion(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return version;
}

export function termsVersionLabel(version: string | null) {
  return version
    ? `Versão ${version}, de novembro de 2026.`
    : "Versão de novembro de 2026.";
}
