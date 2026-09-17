"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push("/");
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setError("E-mail ou senha inválidos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-[#1d4ed8] md:flex">
        <div className="absolute -right-20 -top-45 size-[480px] rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-25 size-[280px] rounded-full bg-white/10" />
        <p className="relative font-brand text-6xl font-bold text-white">Provalyze</p>
      </div>
      <div className="flex w-full items-center justify-center bg-background px-6 md:w-1/2">
        <form onSubmit={handleSubmit} className="w-full max-w-[360px]">
          <div className="mb-6 flex justify-center">
            <Image src="/logo.png" alt="Provalyze" width={48} height={65} />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
          <p className="mb-6 text-sm text-muted">
            Entre com sua conta institucional para continuar.
          </p>

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

          <div className="mb-3 flex flex-col gap-1.5">
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

          <div className="mb-6 flex items-center justify-between">
            <label className="flex items-center gap-2 text-[13px] text-muted">
              <input type="checkbox" className="size-4 rounded accent-primary" />
              Lembrar acesso
            </label>
            <Link
              href="/esqueci-senha"
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>

          {error && <p className="mb-4 text-[13px] text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>

          <p className="mt-4 text-center text-[13px] text-muted">
            Não possui uma conta?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}