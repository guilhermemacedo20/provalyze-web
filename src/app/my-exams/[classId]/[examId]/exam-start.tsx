"use client";

import {
  ArrowLeftRight,
  ClipboardPaste,
  Clock,
  Copy,
  EyeOff,
  MousePointerClick,
  Save,
  ShieldCheck,
  Scissors,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const RULES = [
  {
    icon: Clock,
    text: "O tempo começa a contar assim que você inicia a prova.",
  },
  {
    icon: Save,
    text: "Se sair da prova, você pode continuar de onde parou enquanto houver tempo.",
  },
  {
    icon: ShieldCheck,
    text: "Ao entregar, você vê a correção das questões objetivas na hora. As dissertativas aguardam o professor.",
  },
];

const REGISTERED_EVENTS = [
  {
    icon: ArrowLeftRight,
    label: "Troca de aba",
    description: "Quando você sai desta aba para outra.",
  },
  {
    icon: EyeOff,
    label: "Perda de foco",
    description: "Quando a janela da prova deixa de ficar em primeiro plano.",
  },
  {
    icon: Copy,
    label: "Copiar",
    description: "Uso de copiar (Ctrl+C) durante a prova.",
  },
  {
    icon: ClipboardPaste,
    label: "Colar",
    description: "Uso de colar (Ctrl+V) nas respostas.",
  },
  {
    icon: Scissors,
    label: "Recortar",
    description: "Uso de recortar (Ctrl+X) durante a prova.",
  },
  {
    icon: MousePointerClick,
    label: "Menu de contexto",
    description: "Abrir o menu do botão direito do mouse.",
  },
];

export function ExamStart({
  title,
  courseName,
  subjectName,
  durationMinutes,
  available,
  continuing,
  starting,
  message,
  error,
  backHref,
  onStart,
}: {
  title: string;
  courseName?: string;
  subjectName?: string;
  durationMinutes?: number | null;
  available: boolean;
  continuing: boolean;
  starting: boolean;
  message: string;
  error: string | null;
  backHref: string;
  onStart: () => void;
}) {
  const [aware, setAware] = useState(false);

  const meta = [
    [courseName, subjectName].filter(Boolean).join(" · "),
    durationMinutes ? `${durationMinutes} min` : "",
  ].filter(Boolean);

  return (
    <div className="px-10 py-9">
      <Link
        href={backHref}
        className="inline-block rounded-full bg-[#16A34A] px-4 py-2 text-sm text-white"
      >
        <span className="mr-2 font-bold">←</span> Voltar
      </Link>

      <div className="mx-auto mt-4 w-full max-w-2xl">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {meta.length > 0 && (
            <p className="mt-2 text-sm text-muted">{meta.join(" · ")}</p>
          )}
        </header>

        {!available ? (
          <div className="rounded-[22px] border border-border bg-surface px-6 py-8 text-center shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
            <p className="text-sm text-foreground">{message}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <section className="rounded-[22px] border border-border bg-surface px-6 py-5 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
              <h2 className="mb-3 text-[15px] font-semibold text-foreground">
                Antes de começar
              </h2>
              <ul className="flex flex-col gap-3">
                {RULES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm">
                    <Icon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span className="text-foreground">{text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[22px] border border-border bg-surface px-6 py-5 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
              <h2 className="mb-1 text-[15px] font-semibold text-foreground">
                O que fica registrado
              </h2>
              <p className="mb-4 text-[13px] text-muted">
                Estas ocorrências ficam registradas na sua tentativa, uma vez
                por tipo em cada questão, e o professor pode consultá-las na
                correção.
              </p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {REGISTERED_EVENTS.map(
                  ({ icon: Icon, label, description }) => (
                    <li
                      key={label}
                      className="flex items-start gap-3 rounded-xl border border-border px-4 py-3"
                    >
                      <Icon
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-warning"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {label}
                        </p>
                        <p className="text-[12px] text-muted">{description}</p>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </section>

            <section className="rounded-[22px] border border-border bg-surface px-6 py-5 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
              <label
                htmlFor="exam-aware"
                className="flex cursor-pointer items-start gap-3 text-sm text-foreground"
              >
                <input
                  id="exam-aware"
                  type="checkbox"
                  checked={aware}
                  onChange={(event) => setAware(event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                <span>
                  Estou ciente de que essas ocorrências são registradas durante
                  a prova.
                </span>
              </label>

              {error && <p className="mt-4 text-sm text-danger">{error}</p>}

              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={onStart}
                  disabled={!aware || starting}
                  className="cursor-pointer rounded-full bg-[#16A34A] px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {starting
                    ? "Carregando..."
                    : continuing
                      ? "Continuar prova"
                      : "Iniciar prova"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}