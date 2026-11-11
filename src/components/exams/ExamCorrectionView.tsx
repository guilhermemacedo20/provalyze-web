"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Minus,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { aiService } from "@/services/ai.service";
import {
  CorrectionQuestion,
  ExamCorrection,
  examsService,
  GradeAnswerResult,
} from "@/services/exams.service";
import { formatPoints, formatScore } from "@/lib/exam-format";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { round2 } from "./exam-wizard-types";
import { IntegrityTimeline } from "./IntegrityTimeline";

type AiStatus = "loading" | "error";
type AiState = Record<string, AiStatus>;
type QuestionState =
  | "correct"
  | "partial"
  | "wrong"
  | "loading"
  | "suggested"
  | "pending";

function isCorrected(question: CorrectionQuestion) {
  return question.gradeStatus !== "PENDING";
}

function questionState(
  question: CorrectionQuestion,
  ai: AiState,
): QuestionState {
  if (isCorrected(question)) {
    if (question.score >= question.maxScore - 0.001) return "correct";
    return question.score > 0 ? "partial" : "wrong";
  }
  if (question.answerId && ai[question.answerId] === "loading") {
    return "loading";
  }
  if (question.aiSuggestedScore !== null) return "suggested";
  return "pending";
}

const STATE_META: Record<
  QuestionState,
  { label: string; tile: string; Icon?: LucideIcon; iconClass?: string }
> = {
  correct: {
    label: "Correta",
    tile: "border border-[#86EFAC] bg-[#DCFCE7] text-[#166534]",
    Icon: Check,
  },
  partial: {
    label: "Parcial",
    tile: "border border-[#FDE68A] bg-[#FFFBEB] text-[#854D0E]",
    Icon: Minus,
  },
  wrong: {
    label: "Errada",
    tile: "border border-[#FCA5A5] bg-[#FEE2E2] text-[#991B1B]",
    Icon: X,
  },
  loading: {
    label: "IA corrigindo",
    tile: "border border-[#FCD34D] bg-[#FEF3C7] text-[#92400E]",
    Icon: LoaderCircle,
    iconClass: "animate-spin",
  },
  suggested: {
    label: "Sugestão da IA pronta",
    tile: "border border-[#93C5FD] bg-[#DBEAFE] text-[#1D4ED8]",
    Icon: Sparkles,
  },
  pending: {
    label: "Aguardando correção",
    tile: "border border-[#CBD5E1] bg-white text-[#64748B]",
  },
};

function parseScore(text: string): number | null {
  const trimmed = text.trim();
  const value = Number(trimmed.replace(",", "."));
  if (!trimmed || !Number.isFinite(value) || value < 0) return null;
  return round2(value);
}

function AiSuggestion({
  question,
  status,
  onRequest,
  onUse,
}: {
  question: CorrectionQuestion;
  status?: AiStatus;
  onRequest: () => void;
  onUse: (score: number) => void;
}) {
  if (!question.content.trim() || isCorrected(question)) return null;

  const box =
    "mb-5 flex items-start gap-3 rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3";

  if (status === "loading") {
    return (
      <div className={box}>
        <LoaderCircle
          className="mt-0.5 size-4 shrink-0 animate-spin text-primary"
          aria-hidden
        />
        <p className="text-[13px] text-foreground">
          A IA está analisando a resposta...
        </p>
      </div>
    );
  }

  if (question.aiSuggestedScore !== null) {
    return (
      <div className={box}>
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-foreground">
            A IA sugere{" "}
            <strong>{formatPoints(question.aiSuggestedScore)}</strong> de{" "}
            {formatPoints(question.maxScore)}
          </p>
          {question.aiJustification && (
            <p className="mt-0.5 break-words text-[13px] text-muted">
              {question.aiJustification}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onUse(question.aiSuggestedScore as number)}
          className="shrink-0 cursor-pointer rounded-md border border-primary bg-surface px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary hover:text-white"
        >
          Usar sugestão
        </button>
      </div>
    );
  }

  return (
    <div className={box}>
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        {status === "error" && (
          <p className="mb-1 text-[13px] text-muted">
            A IA não conseguiu sugerir uma nota. Você pode corrigir manualmente.
          </p>
        )}
        <button
          type="button"
          onClick={onRequest}
          className="cursor-pointer text-[13px] font-semibold text-primary hover:underline"
        >
          {status === "error" ? "Tentar novamente" : "Sugerir nota com IA"}
        </button>
      </div>
    </div>
  );
}

function OpenAnswerGrader({
  question,
  aiStatus,
  hasNext,
  onRequestAi,
  onSaved,
  onNext,
}: {
  question: CorrectionQuestion;
  aiStatus?: AiStatus;
  hasNext: boolean;
  onRequestAi: () => void;
  onSaved: (result: GradeAnswerResult) => void;
  onNext: () => void;
}) {
  const [scoreText, setScoreText] = useState(
    question.gradeStatus === "TEACHER_APPROVED"
      ? String(question.score).replace(".", ",")
      : "",
  );
  const [feedback, setFeedback] = useState(question.teacherFeedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const setScore = (value: number) => {
    setScoreText(String(value).replace(".", ","));
    setSaved(false);
    setError(null);
  };

  const quickScores = [
    { label: "Zerar", value: 0 },
    { label: "Metade", value: round2(question.maxScore / 2) },
    { label: "Nota cheia", value: question.maxScore },
  ];

  const save = async (goNext: boolean) => {
    if (!question.answerId) return;

    const score = parseScore(scoreText);
    if (score === null) {
      setError("Informe uma nota válida, a partir de 0.");
      return;
    }
    if (score > question.maxScore) {
      setError(
        `A nota não pode passar de ${formatPoints(question.maxScore)} nesta questão.`,
      );
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await examsService.gradeAnswer(question.answerId, {
        score,
        feedback: feedback.trim() || undefined,
      });
      onSaved(result);
      setSaved(true);
      if (goNext) onNext();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-md border border-border bg-background p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-foreground">
          Correção do professor
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
            isCorrected(question)
              ? "bg-[#DCFCE7] text-[#166534]"
              : "bg-[#FEF3C7] text-[#92400E]"
          }`}
        >
          {isCorrected(question) ? "Corrigida" : "Aguardando correção"}
        </span>
      </div>

      <AiSuggestion
        question={question}
        status={aiStatus}
        onRequest={onRequestAi}
        onUse={setScore}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label
          htmlFor="grade-score"
          className="text-[13px] font-medium text-foreground"
        >
          Nota
        </label>
        <div className="flex items-center gap-2">
          <input
            id="grade-score"
            inputMode="decimal"
            value={scoreText}
            onChange={(e) => {
              setScoreText(e.target.value);
              setSaved(false);
            }}
            placeholder="0"
            className="h-10 w-20 rounded-md border-2 border-border bg-surface px-3 text-center text-base font-semibold text-foreground focus:border-primary focus:outline-none"
          />
          <span className="text-[13px] text-muted">
            de {formatPoints(question.maxScore)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickScores.map((quick) => (
            <button
              key={quick.label}
              type="button"
              onClick={() => setScore(quick.value)}
              className="cursor-pointer rounded-full border border-border bg-surface px-3 py-1 text-[12px] font-medium text-foreground hover:border-primary hover:text-primary"
            >
              {quick.label}
            </button>
          ))}
        </div>
      </div>

      <label
        htmlFor="grade-feedback"
        className="mb-1.5 block text-[13px] font-medium text-foreground"
      >
        Feedback para o aluno{" "}
        <span className="font-normal text-muted">(opcional)</span>
      </label>
      <textarea
        id="grade-feedback"
        value={feedback}
        onChange={(e) => {
          setFeedback(e.target.value);
          setSaved(false);
        }}
        maxLength={1000}
        rows={3}
        placeholder="Comente o que o aluno acertou ou pode melhorar"
        className="w-full rounded-md border-2 border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
      />

      {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
      {saved && !error && (
        <p className="mt-3 flex items-center gap-1 text-[13px] text-success">
          <Check className="size-4" aria-hidden />
          Nota salva.
        </p>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={saving || !question.answerId}
          className="cursor-pointer rounded-md border border-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar nota"}
        </button>
        {hasNext && (
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving || !question.answerId}
            className="flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Salvar e próxima
            <ChevronRight className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

function MultipleChoiceReview({ question }: { question: CorrectionQuestion }) {
  return (
    <>
      <div className="mt-6 flex flex-col gap-3">
        {question.options.map((option) => {
          const chosen = question.content === option.label;
          const correct = question.correctOption === option.label;

          return (
            <div
              key={option.label}
              className={`flex min-w-0 items-center gap-4 rounded-md border-2 px-4 py-3 ${
                correct
                  ? "border-[#86EFAC] bg-[#F0FDF4]"
                  : chosen
                    ? "border-[#FCA5A5] bg-[#FEF2F2]"
                    : "border-border"
              }`}
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  correct
                    ? "bg-success text-white"
                    : chosen
                      ? "bg-danger text-white"
                      : "bg-background text-muted"
                }`}
              >
                {option.label}
              </span>
              <span className="min-w-0 flex-1 break-words text-[15px] text-foreground">
                {option.text}
              </span>
              {chosen && (
                <span className="shrink-0 rounded-full bg-surface px-2.5 py-0.5 text-[12px] font-semibold text-foreground">
                  Resposta do aluno
                </span>
              )}
              {correct && (
                <Check
                  className="size-5 shrink-0 text-success"
                  aria-label="Correta"
                />
              )}
            </div>
          );
        })}
      </div>

      {!question.content && (
        <p className="mt-3 text-[13px] italic text-muted">
          O aluno não respondeu esta questão.
        </p>
      )}
      <p className="mt-5 text-[13px] text-muted">
        Correção automática:{" "}
        <strong className="text-foreground">
          {formatPoints(question.score)} de {formatPoints(question.maxScore)}
        </strong>
      </p>
    </>
  );
}

export function ExamCorrectionView({
  examId,
  studentId,
}: {
  examId: string;
  studentId: string;
}) {
  const [data, setData] = useState<ExamCorrection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [ai, setAi] = useState<AiState>({});
  const requested = useRef<Set<string>>(new Set());

  const requestAi = useCallback(async (answerId: string) => {
    setAi((prev) => ({ ...prev, [answerId]: "loading" }));
    try {
      const result = await aiService.validateQuestion(answerId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((q) =>
                q.answerId === answerId
                  ? {
                      ...q,
                      aiSuggestedScore: result.suggestedScore,
                      aiJustification: result.justification,
                    }
                  : q,
              ),
            }
          : prev,
      );
      setAi((prev) => {
        const next = { ...prev };
        delete next[answerId];
        return next;
      });
    } catch {
      setAi((prev) => ({ ...prev, [answerId]: "error" }));
    }
  }, []);

  const queueAi = useCallback(
    async (questions: CorrectionQuestion[]) => {
      const pending = questions.filter(
        (q): q is CorrectionQuestion & { answerId: string } =>
          q.type === "OPEN_ENDED" &&
          q.answerId !== null &&
          q.gradeStatus === "PENDING" &&
          q.content.trim() !== "" &&
          q.aiSuggestedScore === null &&
          !requested.current.has(q.answerId),
      );
      if (pending.length === 0) return;

      pending.forEach((q) => requested.current.add(q.answerId));
      setAi((prev) => ({
        ...prev,
        ...Object.fromEntries(pending.map((q) => [q.answerId, "loading"])),
      }));

      for (const q of pending) {
        await requestAi(q.answerId);
      }
    },
    [requestAi],
  );

  useEffect(() => {
    examsService
      .getCorrection(examId, studentId)
      .then((result) => {
        setData(result);
        queueAi(result.questions);
      })
      .catch((e) => setError(extractErrorMessage(e)));
  }, [examId, studentId, queueAi]);

  const handleSaved = (result: GradeAnswerResult) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            score: result.sessionScore,
            questions: prev.questions.map((q) =>
              q.answerId === result.answerId
                ? {
                    ...q,
                    score: result.score,
                    gradeStatus: result.gradeStatus,
                    teacherFeedback: result.teacherFeedback,
                    isCorrect: result.score === q.maxScore,
                  }
                : q,
            ),
          }
        : prev,
    );
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const questionsCount = data?.questions.length ?? 0;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(questionsCount - 1, current + 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(0, current - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [questionsCount]);

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: 0 });
  }, [index]);

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white">
        <p className="text-sm text-muted">
          {error ?? "Carregando correção..."}
        </p>
        {error && (
          <Link
            href={`/exams/${examId}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Voltar para a prova
          </Link>
        )}
      </div>
    );
  }

  const total = data.questions.length;
  const question = data.questions[index];
  if (!question) return null;

  const correctedCount = data.questions.filter(isCorrected).length;
  const aiRunning = Object.values(ai).filter((s) => s === "loading").length;
  const kind = question.type === "OPEN_ENDED" ? "Discursiva" : "Objetiva";
  const state = STATE_META[questionState(question, ai)];
  const goTo = (target: number) =>
    setIndex(Math.min(total - 1, Math.max(0, target)));
  const nextPending = [
    ...data.questions.slice(index + 1),
    ...data.questions.slice(0, index + 1),
  ].find((q) => !isCorrected(q));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <Image src="/logo.png" alt="" width={26} height={35} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {data.exam.title}
          </p>
          <p className="truncate text-xs text-muted">
            Aluno: {data.student.name}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary-light px-3 py-1.5 text-sm font-semibold text-primary">
          Nota {formatScore(data.score)} / {formatPoints(data.exam.targetScore)}
        </span>
        <Link
          href={`/exams/${examId}`}
          aria-label="Voltar para a prova"
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-background"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Voltar para a prova</span>
        </Link>
      </header>
      <div className="h-1 shrink-0 bg-border">
        <div
          className="h-full bg-success transition-all duration-300"
          style={{ width: `${(correctedCount / total) * 100}%` }}
        />
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_288px] lg:py-8">
          <div className="flex min-w-0 flex-col gap-5">
            <section className="flex min-w-0 flex-col rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-primary-light px-2.5 py-1 text-primary">
                  Questão {index + 1} de {total}
                </span>
                <span className="rounded-full bg-background px-2.5 py-1 text-muted">
                  {kind}
                </span>
                <span className="rounded-full bg-background px-2.5 py-1 text-muted">
                  {question.themeName}
                </span>
                <span className="rounded-full bg-background px-2.5 py-1 text-muted">
                  Vale {formatPoints(question.maxScore)}
                </span>
                <span
                  className={`ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 ${state.tile}`}
                >
                  {state.Icon && (
                    <state.Icon
                      className={`size-3.5 ${state.iconClass ?? ""}`}
                      aria-hidden
                    />
                  )}
                  {state.label}
                </span>
              </div>

              <h1 className="whitespace-pre-wrap break-words text-lg font-semibold leading-relaxed text-foreground sm:text-xl">
                {question.statement}
              </h1>

              {question.type === "MULTIPLE_CHOICE" ? (
                <MultipleChoiceReview question={question} />
              ) : (
                <>
                  <p className="mb-2 mt-6 text-[12px] font-semibold uppercase tracking-wide text-muted">
                    Resposta do aluno
                  </p>
                  <div className="whitespace-pre-wrap break-words rounded-md border-l-4 border-primary bg-background px-4 py-3 text-[15px] leading-relaxed text-foreground">
                    {question.content || (
                      <span className="italic text-muted">Sem resposta.</span>
                    )}
                  </div>
                  <OpenAnswerGrader
                    key={question.answerId ?? question.number}
                    question={question}
                    aiStatus={
                      question.answerId ? ai[question.answerId] : undefined
                    }
                    hasNext={index < total - 1}
                    onRequestAi={() => {
                      if (question.answerId) requestAi(question.answerId);
                    }}
                    onSaved={handleSaved}
                    onNext={() => goTo(index + 1)}
                  />
                </>
              )}

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  disabled={index === 0}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Anterior
                </button>
                <span className="hidden text-xs text-muted sm:block">
                  Use as setas ← → do teclado para navegar
                </span>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  disabled={index === total - 1}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            </section>

            <IntegrityTimeline integrity={data.integrity} />
          </div>

          <aside className="order-first lg:sticky lg:top-8 lg:order-none lg:self-start">
            <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Questões
                </p>
                <p className="text-xs text-muted">
                  <span className="font-semibold text-foreground">
                    {correctedCount}
                  </span>{" "}
                  de {total} corrigidas
                </p>
              </div>
              {aiRunning > 0 && (
                <p className="mb-3 flex items-center gap-1.5 text-[12px] text-[#92400E]">
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                  IA analisando {aiRunning}{" "}
                  {aiRunning === 1 ? "resposta" : "respostas"}...
                </p>
              )}

              <div className="grid grid-cols-6 gap-2 sm:grid-cols-10 lg:grid-cols-5">
                {data.questions.map((item, itemIndex) => {
                  const current = itemIndex === index;
                  const meta = STATE_META[questionState(item, ai)];
                  return (
                    <button
                      key={item.number}
                      type="button"
                      onClick={() => setIndex(itemIndex)}
                      title={`Questão ${itemIndex + 1}: ${meta.label}`}
                      aria-label={`Questão ${itemIndex + 1}: ${meta.label}`}
                      aria-current={current ? "step" : undefined}
                      className={`flex h-10 cursor-pointer items-center justify-center gap-0.5 rounded-md text-sm font-semibold transition ${meta.tile} ${
                        current ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                    >
                      {itemIndex + 1}
                      {meta.Icon && (
                        <meta.Icon
                          className={`size-3 ${meta.iconClass ?? ""}`}
                          aria-hidden
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted">
                {(Object.keys(STATE_META) as QuestionState[]).map((key) => {
                  const { label, tile, Icon, iconClass } = STATE_META[key];
                  return (
                    <li key={key} className="flex items-center gap-1.5">
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded ${tile}`}
                      >
                        {Icon && (
                          <Icon
                            className={`size-2.5 ${iconClass ?? ""}`}
                            aria-hidden
                          />
                        )}
                      </span>
                      {label}
                    </li>
                  );
                })}
              </ul>

              {nextPending ? (
                <button
                  type="button"
                  onClick={() => setIndex(nextPending.number - 1)}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#FEF3C7] px-3 py-2.5 text-[13px] font-semibold text-[#92400E] hover:bg-[#FDE68A]"
                >
                  Ir para a próxima pendente
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              ) : (
                <p className="mt-4 flex items-center justify-center gap-1.5 rounded-md bg-[#DCFCE7] px-3 py-2.5 text-[13px] font-semibold text-[#166534]">
                  <Check className="size-4" aria-hidden />
                  Todas as questões corrigidas
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}