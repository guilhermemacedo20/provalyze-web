"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authService } from "@/services/auth.service";
import { extractErrorMessage } from "@/lib/extract-error-message";

type ProfileRole = "TEACHER" | "STUDENT";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProfileRole>("TEACHER");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Preencha todos os campos.");
      return;
    }
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (!acceptedTerms) {
      setError("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }

    setSubmitting(true);
    try {
      await authService.register({
        name: name.trim(),
        email: email.trim(),
        role,
        password,
      });
      setSuccess(true);
    } catch (err) {
      console.error("Erro ao criar conta:", err);
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Painel de marca */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-[#1d4ed8] md:flex">
        <div className="absolute -right-20 -top-45 size-[480px] rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-25 size-[280px] rounded-full bg-white/10" />
        <p className="relative font-brand text-6xl font-bold text-white">Provalyze</p>
      </div>

      {/* Painel do formulário */}
      <div className="flex w-full items-center justify-center bg-background px-6 py-10 md:w-1/2">
        {success ? (
          <div className="w-full max-w-[360px] rounded-lg bg-primary-light px-8 py-10 text-center">
            <div className="mb-4 flex justify-center">
              <Image src="/logo.png" alt="Provalyze" width={48} height={65} />
            </div>
            <p className="mb-6 text-base font-bold text-foreground">
              Conta criada com sucesso!
            </p>
            <Link
              href="/login"
              className="inline-block w-full rounded-md bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-[360px]">
            <div className="mb-6 flex justify-center">
              <Image src="/logo.png" alt="Provalyze" width={48} height={65} />
            </div>

            <h1 className="mb-2 text-2xl font-bold text-foreground">Criar conta</h1>
            <p className="mb-6 text-sm text-muted">
              Preencha seus dados para começar a usar o Provalyze.
            </p>

            <div className="mb-4 flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[13px] font-medium text-foreground">
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mariana Santos"
                className="rounded-md border border-border bg-surface px-3.5 py-3 text-sm text-foreground placeholder:text-muted"
              />
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
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

            <div className="mb-4 flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-foreground">Perfil</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole("TEACHER")}
                  className={`flex-1 rounded-md py-2.5 text-xs font-medium ${
                    role === "TEACHER"
                      ? "bg-primary text-white"
                      : "border border-border bg-surface text-foreground"
                  }`}
                >
                  Professor
                </button>
                <button
                  type="button"
                  onClick={() => setRole("STUDENT")}
                  className={`flex-1 rounded-md py-2.5 text-xs font-medium ${
                    role === "STUDENT"
                      ? "bg-primary text-white"
                      : "border border-border bg-surface text-foreground"
                  }`}
                >
                  Aluno
                </button>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[13px] font-medium text-foreground">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-md border border-border bg-surface px-3.5 py-3 text-sm text-foreground placeholder:text-muted"
              />
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-[13px] font-medium text-foreground">
                Confirmar senha
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-md border border-border bg-surface px-3.5 py-3 text-sm text-foreground placeholder:text-muted"
              />
            </div>

            <label className="mb-4 flex items-start gap-2 text-[12px] text-muted">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded accent-primary"
              />
              Li e aceito os Termos de Uso e a Política de Privacidade (LGPD).
            </label>

            {error && <p className="mb-4 text-[13px] text-danger">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {submitting ? "Criando..." : "Criar conta"}
            </button>

            <p className="mt-4 text-center text-[13px] text-muted">
              Já possui uma conta?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}