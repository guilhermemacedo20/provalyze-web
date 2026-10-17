"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import type {
  CorrectionIntegrity,
  ExamEventType,
} from "@/services/exams.service";

type Level = "info" | "warning";

type Row = {
  key: string;
  time: string;
  text: string;
  level: Level;
};

const EVENT_TEXT: Record<ExamEventType, string> = {
  PASTE: "Colou conteúdo na resposta.",
  COPY: "Tentativa de copiar conteúdo detectada.",
  CUT: "Tentativa de recortar conteúdo detectada.",
  TAB_SWITCH: "Aluno trocou de aba durante a avaliação.",
  WINDOW_BLUR: "Aluno perdeu o foco da avaliação.",
  CONTEXT_MENU: "Abriu o menu do botão direito.",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function IntegrityTimeline({
  integrity,
}: {
  integrity: CorrectionIntegrity;
}) {
  const [open, setOpen] = useState(true);

  const rows: Row[] = [];

  if (integrity.startedAt) {
    rows.push({
      key: "start",
      time: formatTime(integrity.startedAt),
      text: "Sessão iniciada.",
      level: "info",
    });
  }

  integrity.events.forEach((event) => {
    rows.push({
      key: event.id,
      time: formatTime(event.createdAt),
      text:
        EVENT_TEXT[event.type] +
        (event.questionNumber ? ` (Questão ${event.questionNumber})` : ""),
      level: "warning",
    });
  });

  if (integrity.finishedAt) {
    rows.push({
      key: "end",
      time: formatTime(integrity.finishedAt),
      text: "Prova enviada.",
      level: "info",
    });
  }

  const warnings = integrity.events.length;
  const title =
    warnings === 0
      ? "nenhum evento de atenção"
      : warnings === 1
        ? "1 evento de atenção"
        : `${warnings} eventos de atenção`;

  return (
    <section className="rounded-[22px] border border-border bg-surface px-5 py-4 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-foreground">
          <ShieldAlert size={16} className="shrink-0 text-danger" />
          <span className="truncate">Integridade da avaliação: {title}</span>
        </h2>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex shrink-0 cursor-pointer items-center gap-1 text-[12px] font-medium text-primary hover:underline"
        >
          {open ? "Ocultar linha do tempo" : "Mostrar linha do tempo"}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {open && (
        <ul className="mt-3">
          {rows.length === 0 && (
            <li className="border-t border-border py-2.5 text-[12px] text-muted">
              Nenhum registro para esta sessão.
            </li>
          )}
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center gap-3 border-t border-border py-2.5 text-[12px]"
            >
              <span className="w-12 shrink-0 text-muted">{row.time}</span>
              <span
                className={`size-1.5 shrink-0 rounded-full ${
                  row.level === "warning" ? "bg-warning" : "bg-primary"
                }`}
              />
              <span className="min-w-0 flex-1 break-words text-foreground">
                {row.text}
              </span>
              <span
                className={`shrink-0 font-medium ${
                  row.level === "warning" ? "text-warning" : "text-primary"
                }`}
              >
                {row.level === "warning" ? "Atenção" : "Informativo"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
