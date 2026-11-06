"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { QuestionImage } from "@/components/questions/QuestionImage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { optionLabels } from "@/utils/optionLabels";
import {
  ExamEventType,
  ExamQuestion,
  examsService,
} from "@/services/exams.service";

type Draft = Record<string, { optionId?: string; content?: string }>;

function secondsLeft(expiresAt?: string, now = Date.now()) {
  if (!expiresAt) return null;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}

function formatClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

function isAnswered(question: ExamQuestion, draft?: Draft[string]) {
  if (question.type === "MULTIPLE_CHOICE") return Boolean(draft?.optionId);
  return Boolean(draft?.content?.trim());
}

export function ExamRunner({
  title,
  subjectName,
  questions,
  answers,
  expiresAt,
  classId,
  examId,
  submitting,
  error,
  onAnswer,
  onSubmit,
}: {
  title: string;
  subjectName: string;
  questions: ExamQuestion[];
  answers: Draft;
  expiresAt?: string;
  submitting: boolean;
  classId: string;
  examId: string;
  error: string | null;
  onAnswer: (question: ExamQuestion, value: Draft[string]) => void;
  onSubmit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const question = questions[index];
  const questionRef = useRef(question);
  const [lastEvent, setLastEvent] = useState<{
    event: ExamEventType;
    examQuestionId: string;
  } | null>(null);
  const seconds = secondsLeft(expiresAt, now);
  const scrollRef = useRef<HTMLDivElement>(null);
  const total = questions.length;
  const unanswered = questions.filter(
    (item) => !isAnswered(item, answers[item.id]),
  ).length;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(total - 1, current + 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(0, current - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [total]);

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: 0 });
  }, [index]);

  questionRef.current = question;
  useEffect(() => {
    const send = (type: ExamEventType) => {
      const current = questionRef.current;

      if (!current) return;

      if (
        lastEvent?.event === type &&
        lastEvent?.examQuestionId === current.id
      ) {
        return;
      }
      setLastEvent({ event: type, examQuestionId: current.id });
      examsService.createExamEvent(classId, examId, {
        type,
        examQuestionId: current.id,
      });
    };

    const onPaste = () => send("PASTE");
    const onCopy = () => send("COPY");
    const onCut = () => send("CUT");
    const onVisibility = () => {
      if (document.hidden) send("TAB_SWITCH");
    };
    const onBlur = () => {
      if (!document.hidden) send("WINDOW_BLUR");
    };
    const onContextMenu = () => send("CONTEXT_MENU");
    window.addEventListener("paste", onPaste);
    window.addEventListener("copy", onCopy);
    window.addEventListener("cut", onCut);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("cut", onCut);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, [classId, examId]);

  if (!question) return null;

  const kind = question.type === "OPEN_ENDED" ? "Discursiva" : "Objetiva";
  const answered = isAnswered(question, answers[question.id]);
  const answeredCount = total - unanswered;
  const isLast = index === total - 1;
  const content = answers[question.id]?.content ?? "";
  const timerTone =
    seconds === null || seconds > 600
      ? "bg-[#DCFCE7] text-[#166534]"
      : seconds > 300
        ? "bg-[#FEF3C7] text-[#92400E]"
        : "animate-pulse bg-[#FEE2E2] text-[#991B1B]";

  const finish = () => (unanswered > 0 ? setConfirmOpen(true) : onSubmit());

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <Image src="/logo.png" alt="" width={26} height={35} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {title}
          </p>
          {subjectName && (
            <p className="truncate text-xs text-muted">{subjectName}</p>
          )}
        </div>
        {seconds !== null && (
          <span
            title="Tempo restante"
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums ${timerTone}`}
          >
            <Clock className="size-4" aria-hidden />
            {formatClock(seconds)}
          </span>
        )}
        <button
          type="button"
          onClick={finish}
          disabled={submitting}
          className="shrink-0 rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? (
            "Finalizando..."
          ) : (
            <>
              Finalizar <span className="hidden sm:inline">prova</span>
            </>
          )}
        </button>
      </header>
      <div className="h-1 shrink-0 bg-border">
        <div
          className="h-full bg-success transition-all duration-300"
          style={{ width: `${(answeredCount / total) * 100}%` }}
        />
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_272px] lg:py-8">
          <section className="flex min-w-0 flex-col rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-primary-light px-2.5 py-1 text-primary">
                Questão {index + 1} de {total}
              </span>
              <span className="rounded-full bg-background px-2.5 py-1 text-muted">
                {kind}
              </span>
              {question.themeName && (
                <span className="rounded-full bg-background px-2.5 py-1 text-muted">
                  {question.themeName}
                </span>
              )}
              {answered && (
                <span className="ml-auto flex items-center gap-1 text-success">
                  <Check className="size-4" aria-hidden />
                  Respondida
                </span>
              )}
            </div>

            <h1 className="whitespace-pre-wrap break-words text-lg font-semibold leading-relaxed text-foreground sm:text-xl">
              {question.statement}
            </h1>
            {question.imageUrl && (
              <div className="mt-5 flex justify-center">
                <QuestionImage
                  src={question.imageUrl}
                  alt={`Imagem da questão ${index + 1}`}
                  className="max-h-80 max-w-full rounded-md object-contain"
                />
              </div>
            )}

            {question.type === "MULTIPLE_CHOICE" ? (
              <div className="mt-6 flex flex-col gap-3">
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question.id]?.optionId === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`group flex cursor-pointer items-center gap-4 rounded-md border-2 px-4 py-3.5 transition-colors ${
                        selected
                          ? "border-primary bg-primary-light/50"
                          : "border-border hover:border-primary/40 hover:bg-background"
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={selected}
                        onChange={() =>
                          onAnswer(question, { optionId: option.id })
                        }
                        className="sr-only"
                      />
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                          selected
                            ? "bg-primary text-white"
                            : "bg-background text-muted group-hover:text-primary"
                        }`}
                      >
                        {optionLabels[optionIndex]}
                      </span>
                      <span className="min-w-0 flex-1 break-words text-[15px] text-foreground">
                        {option.text}
                      </span>
                      {selected && (
                        <Check
                          className="size-5 shrink-0 text-primary"
                          aria-hidden
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6">
                <textarea
                  value={content}
                  onChange={(event) =>
                    onAnswer(question, { content: event.target.value })
                  }
                  rows={10}
                  className="w-full resize-y rounded-md border-2 border-border bg-surface px-4 py-3 text-[15px] leading-relaxed text-foreground focus:border-primary focus:outline-none"
                  placeholder="Escreva sua resposta aqui..."
                />
                <p className="mt-1.5 text-right text-xs text-muted">
                  {content.length}{" "}
                  {content.length === 1 ? "caractere" : "caracteres"}
                </p>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-danger">{error}</p>}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
              <button
                type="button"
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                disabled={index === 0}
                className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-background disabled:opacity-40"
              >
                <ChevronLeft className="size-4" aria-hidden />
                Anterior
              </button>
              <span className="hidden text-xs text-muted sm:block">
                Use as setas ← → do teclado para navegar
              </span>
              {isLast ? (
                <button
                  type="button"
                  onClick={finish}
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-md bg-success px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  <Check className="size-4" aria-hidden />
                  Concluir
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setIndex((current) => Math.min(total - 1, current + 1))
                  }
                  className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  Próxima
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </section>

          <aside className="order-first lg:sticky lg:top-8 lg:order-none lg:self-start">
            <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Questões
                </p>
                <p className="text-xs text-muted">
                  <span className="font-semibold text-foreground">
                    {answeredCount}
                  </span>{" "}
                  de {total} respondidas
                </p>
              </div>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-10 lg:grid-cols-5">
                {questions.map((item, itemIndex) => {
                  const current = itemIndex === index;
                  const done = isAnswered(item, answers[item.id]);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIndex(itemIndex)}
                      aria-label={`Questão ${itemIndex + 1}${done ? ", respondida" : ""}`}
                      aria-current={current ? "step" : undefined}
                      className={`flex h-10 items-center justify-center rounded-md text-sm font-semibold transition ${
                        done
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : "border border-border bg-surface text-muted hover:border-primary hover:text-primary"
                      } ${current ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    >
                      {itemIndex + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#86EFAC]" />
                  Respondida
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full border border-[#CBD5E1]" />
                  Em branco
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full ring-2 ring-primary" />
                  Atual
                </span>
              </div>
              {unanswered > 0 && (
                <p className="mt-3 rounded-md bg-[#FEF3C7] px-3 py-2 text-xs text-[#92400E]">
                  {unanswered}{" "}
                  {unanswered === 1
                    ? "questão ainda em branco"
                    : "questões ainda em branco"}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Encerrar a prova?"
        message={`Você ainda tem ${unanswered} ${unanswered === 1 ? "questão não respondida" : "questões não respondidas"}. Depois de encerrar, não será possível alterar as respostas. Deseja realmente encerrar a prova?`}
        confirmLabel="Encerrar prova"
        onConfirm={() => {
          setConfirmOpen(false);
          onSubmit();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
