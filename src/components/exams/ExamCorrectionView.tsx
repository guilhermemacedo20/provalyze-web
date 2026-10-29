"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  LoaderCircle,
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
type QuestionState = "correct" | "wrong" | "loading" | "suggested" | "pending";

function isCorrected(question: CorrectionQuestion) {
  return question.gradeStatus !== "PENDING";
}

function questionState(
  question: CorrectionQuestion,
  ai: AiState,
): QuestionState {
  if (isCorrected(question)) {
    return question.score >= question.maxScore - 0.001 ? "correct" : "wrong";
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

  const box = "mb-4 rounded-lg border border-border bg-background px-4 py-3";

  if (status === "loading") {
    return (
      <div className={box}>
        <p className="text-[13px] text-muted">
          A IA está analisando a resposta...
        </p>
      </div>
    );
  }

  if (question.aiSuggestedScore !== null) {
    return (
      <div className={box}>
        <p className="text-[12px] font-semibold tracking-wide text-primary">
          SUGESTÃO DA IA
        </p>
        <p className="mt-1 text-[13px] text-foreground">
          Nota sugerida:{" "}
          <strong>{formatPoints(question.aiSuggestedScore)}</strong> de{" "}
          {formatPoints(question.maxScore)}
        </p>
        {question.aiJustification && (
          <p className="mt-1 break-words text-[13px] text-muted">
            {question.aiJustification}
          </p>
        )}
        <button
          type="button"
          onClick={() => onUse(question.aiSuggestedScore as number)}
          className="mt-2 cursor-pointer text-[13px] font-medium text-primary hover:underline"
        >
          Usar sugestão
        </button>
      </div>
    );
  }

  return (
    <div className={box}>
      {status === "error" && (
        <p className="mb-2 text-[13px] text-muted">
          A IA não conseguiu sugerir uma nota. Você pode corrigir manualmente.
        </p>
      )}
      <button
        type="button"
        onClick={onRequest}
        className="cursor-pointer text-[13px] font-medium text-primary hover:underline"
      >
        {status === "error" ? "Tentar novamente" : "Sugerir nota com IA"}
      </button>
    </div>
  );
}

function OpenAnswerGrader({
  question,
  aiStatus,
  onRequestAi,
  onSaved,
}: {
  question: CorrectionQuestion;
  aiStatus?: AiStatus;
  onRequestAi: () => void;
  onSaved: (result: GradeAnswerResult) => void;
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

  const save = async () => {
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
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 max-w-3xl rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">
          Correção do professor
        </p>
        <span
          className={`text-[12px] font-medium ${
            isCorrected(question) ? "text-success" : "text-warning"
          }`}
        >
          {isCorrected(question) ? "Corrigida" : "Aguardando correção"}
        </span>
      </div>

      <AiSuggestion
        question={question}
        status={aiStatus}
        onRequest={onRequestAi}
        onUse={(score) => {
          setScoreText(String(score).replace(".", ","));
          setSaved(false);
          setError(null);
        }}
      />

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="grade-score" className="text-[13px] text-foreground">
          Nota
        </label>
        <input
          id="grade-score"
          inputMode="decimal"
          value={scoreText}
          onChange={(e) => {
            setScoreText(e.target.value);
            setSaved(false);
          }}
          placeholder="0"
          className="h-9 w-24 rounded-md border border-border bg-surface px-3 text-center text-sm text-foreground"
        />
        <span className="text-[13px] text-muted">
          de {formatPoints(question.maxScore)}
        </span>
      </div>

      <label
        htmlFor="grade-feedback"
        className="mb-1.5 block text-[13px] text-foreground"
      >
        Feedback para o aluno (opcional)
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
        className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
      />

      {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
      {saved && !error && (
        <p className="mt-3 text-[13px] text-success">Nota salva.</p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving || !question.answerId}
          className="cursor-pointer rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar nota"}
        </button>
      </div>
    </div>
  );
}

function MultipleChoiceReview({ question }: { question: CorrectionQuestion }) {
  return (
    <>
      <div className="flex max-w-3xl flex-col gap-3">
        {question.options.map((option) => {
          const chosen = question.content === option.label;
          const correct = question.correctOption === option.label;

          return (
            <div
              key={option.label}
              className={`flex min-w-0 items-center gap-3 rounded-xl border px-4 py-3 ${
                correct
                  ? "border-success bg-[#DCFCE7]"
                  : chosen
                    ? "border-danger bg-[#FEE2E2]"
                    : "border-border"
              }`}
            >
              <span className="min-w-0 flex-1 break-words text-sm text-foreground">
                {option.text}
              </span>
              {chosen && (
                <span className="shrink-0 text-[12px] font-medium text-foreground">
                  Resposta do aluno
                </span>
              )}
              {correct && (
                <span className="shrink-0 text-[12px] font-medium text-success">
                  Correta
                </span>
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
      <p className="mt-4 text-[13px] text-muted">
        Nota: {formatPoints(question.score)} de{" "}
        {formatPoints(question.maxScore)} (correção automática)
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
  const kind = question.type === "OPEN_ENDED" ? "DISCURSIVA" : "OBJETIVA";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Image src="/logo.png" alt="" width={26} height={35} />
          <p className="truncate text-sm font-semibold text-foreground">
            {data.exam.title} : {data.student.name}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm">
          <span className="text-muted">
            Questão {index + 1} de {total}
          </span>
          <span className="rounded-full bg-primary-light px-3 py-1 font-medium text-primary">
            Nota {formatScore(data.score)} / {formatPoints(data.exam.targetScore)}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-8 py-8 lg:px-14">
          <p className="mb-3 text-xs font-semibold tracking-wide text-[#16A34A]">
            QUESTÃO {String(index + 1).padStart(2, "0")} DE{" "}
            {String(total).padStart(2, "0")} · {kind} · {question.themeName}
          </p>
          <h1 className="mb-6 max-w-3xl whitespace-pre-wrap break-words text-lg font-semibold text-foreground">
            {question.statement}
          </h1>

          {question.type === "MULTIPLE_CHOICE" ? (
            <MultipleChoiceReview question={question} />
          ) : (
            <>
              <p className="mb-2 text-[12px] font-semibold tracking-wide text-muted">
                RESPOSTA DO ALUNO
              </p>
              <div className="max-w-3xl whitespace-pre-wrap break-words rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground">
                {question.content || (
                  <span className="italic text-muted">Sem resposta.</span>
                )}
              </div>
              <OpenAnswerGrader
                key={question.answerId ?? question.number}
                question={question}
                aiStatus={question.answerId ? ai[question.answerId] : undefined}
                onRequestAi={() => {
                  if (question.answerId) requestAi(question.answerId);
                }}
                onSaved={handleSaved}
              />
            </>
          )}
          <div className="mt-8 max-w-3xl">
            <IntegrityTimeline integrity={data.integrity} />
          </div>
          <div className="mt-auto flex max-w-3xl items-center justify-between pt-10">
            <button
              type="button"
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
              disabled={index === 0}
              className="cursor-pointer rounded-full border border-[#E2E8F0] px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() =>
                setIndex((current) => Math.min(total - 1, current + 1))
              }
              disabled={index === total - 1}
              className="cursor-pointer rounded-full bg-[#16A34A] px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima →
            </button>
          </div>
        </main>

        <aside className="flex w-72 shrink-0 flex-col border-l border-[#E2E8F0] px-5 py-6">
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted">
            QUESTÕES
          </p>
          <p className="mb-1 text-[12px] text-muted">
            {correctedCount} de {total} corrigidas
          </p>
          {aiRunning > 0 && (
            <p className="mb-3 text-[12px] text-[#8a5a00]">
              IA analisando {aiRunning}{" "}
              {aiRunning === 1 ? "resposta" : "respostas"}...
            </p>
          )}

          <div className="mt-3 grid grid-cols-5 gap-2">
            {data.questions.map((item, itemIndex) => {
              const current = itemIndex === index;
              const state = questionState(item, ai);
              const { tile, Icon, iconClass, label } = STATE_META[state];
              return (
                <button
                  key={item.number}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  title={`Questão ${itemIndex + 1}: ${label}`}
                  aria-label={`Questão ${itemIndex + 1}: ${label}`}
                  aria-current={current ? "step" : undefined}
                  className={`flex h-9 cursor-pointer items-center justify-center gap-1 rounded-lg text-sm font-semibold ${tile} ${
                    current ? "ring-2 ring-foreground ring-offset-1" : ""
                  }`}
                >
                  {itemIndex + 1}
                  {Icon && (
                    <Icon
                      className={`size-3 ${iconClass ?? ""}`}
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>

          <ul className="mt-6 space-y-2 text-sm text-muted">
            {(Object.keys(STATE_META) as QuestionState[]).map((key) => {
              const { label, tile, Icon, iconClass } = STATE_META[key];
              return (
                <li key={key} className="flex items-center gap-2.5">
                  <span
                    className={`flex size-5 items-center justify-center rounded-md ${tile}`}
                  >
                    {Icon && (
                      <Icon
                        className={`size-3 ${iconClass ?? ""}`}
                        aria-hidden
                      />
                    )}
                  </span>
                  {label}
                </li>
              );
            })}
            <li className="flex items-center gap-2.5">
              <span className="size-5 rounded-md ring-2 ring-foreground ring-offset-1" />
              Questão atual
            </li>
          </ul>

          <Link
            href={`/exams/${examId}`}
            className="mt-auto rounded-lg border border-[#E2E8F0] px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-background"
          >
            ← Voltar para a prova
          </Link>
        </aside>
      </div>
    </div>
  );
}