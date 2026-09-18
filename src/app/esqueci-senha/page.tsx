"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { authService } from "@/services/auth.service";
import { extractErrorMessage } from "@/lib/extract-error-message";

type Step = "email" | "reset";

function getPasswordChecks(password: string) {
  return [
    { label: "Mínimo de 8 caracteres", met: password.length >= 8 },
    { label: "Uma letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "Uma letra minúscula", met: /[a-z]/.test(password) },
    { label: "Um número", met: /[0-9]/.test(password) },
  ];
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordChecks = getPasswordChecks(newPassword);
  const allChecksMet = passwordChecks.every((check) => check.met);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!email.trim()) {
      setEmailError("Informe seu e-mail.");
      return;
    }

    setSendingEmail(true);
    try {
      await authService.forgotPassword(email.trim());
      setStep("reset");
    } catch (err) {
      console.error("Erro ao solicitar recuperação:", err);
      setEmailError(extractErrorMessage(err));
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    const code = digits.join("");

    if (code.length < 6) {
      setResetError("Informe o código completo de 6 dígitos.");
      return;
    }
    if (!allChecksMet) {
      setResetError("A senha não atende aos requisitos listados abaixo.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("As senhas não coincidem.");
      return;
    }
    if (!acceptedTerms) {
      setResetError("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }

    setResetting(true);
    try {
      await authService.resetPassword({ email: email.trim(), code, newPassword });
      setSuccess(true);
    } catch (err) {
      console.error("Erro ao redefinir senha:", err);
      setResetError(extractErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-[400px] rounded-lg bg-primary-light px-8 py-10 text-center">
          <p className="mb-6 text-base font-bold text-foreground">
            Senha atualizada com sucesso!
          </p>
          <Link
            href="/login"
            className="inline-block w-full rounded-md bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-[440px] rounded-lg border border-border bg-surface p-8 shadow-sm">
        {step === "email" ? (
          <form onSubmit={handleSendEmail}>
            <h1 className="mb-2 text-center text-base font-bold text-foreground">
              Esqueci minha senha
            </h1>
            <p className="mb-6 text-sm text-muted">
              Digite seu e-mail para receber o código de confirmação.
            </p>

            <div className="mb-6 flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[13px] font-medium text-foreground">
                E-mail institucional
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="professor@escola.edu.br"
                className="rounded-md border border-border bg-surface px-3.5 py-3 text-sm text-foreground placeholder:text-muted"
              />
            </div>

            {emailError && <p className="mb-4 text-[13px] text-danger">{emailError}</p>}

            <div className="flex items-center justify-between">
              <Link
                href="/login"
                className="rounded-md border border-border px-[18px] py-2.5 text-[13px] font-semibold text-foreground hover:bg-background"
              >
                Voltar
              </Link>
              <button
                type="submit"
                disabled={sendingEmail}
                className="rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {sendingEmail ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset}>
            <h1 className="mb-2 text-center text-base font-bold text-foreground">
              Nova senha
            </h1>
            <p className="mb-6 text-sm text-muted">
              Digite o código de confirmação e sua nova senha.
            </p>

            <div className="mb-6 flex justify-between gap-2">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(index, e)}
                  className="h-[41px] w-full rounded-md border border-border bg-surface text-center text-sm text-foreground"
                />
              ))}
            </div>

            <div className="mb-2 flex flex-col gap-1.5">
              <label htmlFor="new-password" className="text-[13px] font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3.5 py-3 pr-10 text-sm text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <ul className="mb-4 flex flex-col gap-1">
              {passwordChecks.map((check) => (
                <li key={check.label} className="flex items-center gap-1.5 text-[12px]">
                  {check.met ? (
                    <Check size={14} className="text-success" />
                  ) : (
                    <X size={14} className="text-muted" />
                  )}
                  <span className={check.met ? "text-success" : "text-muted"}>
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mb-4 flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-[13px] font-medium text-foreground">
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3.5 py-3 pr-10 text-sm text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label className="mb-6 flex items-start gap-2 text-[12px] text-muted">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded accent-primary"
              />
              Li e aceito os Termos de Uso e a Política de Privacidade (LGPD).
            </label>

            {resetError && <p className="mb-4 text-[13px] text-danger">{resetError}</p>}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="rounded-md border border-border px-[18px] py-2.5 text-[13px] font-semibold text-foreground hover:bg-background"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={resetting}
                className="rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {resetting ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}