"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ExamQuestion } from "@/services/exams.service";

type Draft = Record<string, { optionId?: string; content?: string }>;

function formatRemaining(expiresAt?: string, now = Date.now()) {
  if (!expiresAt) return null;
  const totalSeconds = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - now) / 1000),
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock =
    hours > 0
      ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return clock;
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
  error: string | null;
  onAnswer: (question: ExamQuestion, value: Draft[string]) => void;
  onSubmit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const question = questions[index];
  const remaining = formatRemaining(expiresAt, now);
  const total = questions.length;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!question) return null;

  const kind = question.type === "OPEN_ENDED" ? "DISCURSIVA" : "OBJETIVA";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={26} height={35} />
          <p className="text-sm font-semibold text-foreground">
            {title}
            {subjectName ? ` : ${subjectName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">
            Questão {index + 1} de {total}
          </span>
          {remaining && (
            <span className="rounded-full bg-[#DCFCE7] px-3 py-1 font-medium text-[#16A34A]">
              {remaining} restantes
            </span>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col px-8 py-8 lg:px-14">
          <p className="mb-3 text-xs font-semibold tracking-wide text-[#16A34A]">
            QUESTÃO {String(index + 1).padStart(2, "0")} DE{" "}
            {String(total).padStart(2, "0")} · {kind}
          </p>
          <h1 className="mb-6 max-w-3xl text-lg font-semibold text-foreground">
            {question.statement}
          </h1>
          {question.imageUrl && (
            <img
              src={question.imageUrl}
              width={450}
              height={450}
              alt=""
              className="mb-6 max-h-56 rounded-xl max-w-md max-h-md"
            />
          )}

          {question.type === "MULTIPLE_CHOICE" ? (
            <div className="flex max-w-3xl flex-col gap-3">
              {question.options.map((option) => {
                const selected = answers[question.id]?.optionId === option.id;
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${
                      selected ? "border-[#3B82F6]" : "border-[#E2E8F0]"
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={selected}
                      onChange={() =>
                        onAnswer(question, { optionId: option.id })
                      }
                    />
                    <span>{option.text}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <textarea
              value={answers[question.id]?.content ?? ""}
              onChange={(event) =>
                onAnswer(question, { content: event.target.value })
              }
              rows={6}
              className="max-w-3xl rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm"
              placeholder="Escreva sua resposta"
            />
          )}

          <div className="mt-auto flex max-w-3xl items-center justify-between pt-10">
            <button
              type="button"
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
              disabled={index === 0}
              className="rounded-full border border-[#E2E8F0] px-4 py-2 text-sm disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() =>
                setIndex((current) => Math.min(total - 1, current + 1))
              }
              disabled={index === total - 1}
              className="rounded-full bg-[#16A34A] px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              Próxima →
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        </main>

        <aside className="flex w-72 shrink-0 flex-col border-l border-[#E2E8F0] px-5 py-6">
          <p className="mb-4 text-xs font-semibold tracking-wide text-muted">
            QUESTÕES
          </p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((item, itemIndex) => {
              const current = itemIndex === index;
              const answered = isAnswered(item, answers[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  className={`flex h-9 items-center justify-center rounded-lg text-sm ${
                    current
                      ? "bg-[#16A34A] text-white"
                      : answered
                        ? "bg-[#DCFCE7] text-[#166534]"
                        : "border border-[#E2E8F0] bg-white text-foreground"
                  }`}
                >
                  {itemIndex + 1}
                </button>
              );
            })}
          </div>

          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#16A34A]" />
              Atual
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#DCFCE7]" />
              Respondida
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full border border-[#CBD5E1] bg-white" />
              Não respondida
            </li>
          </ul>

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="mt-auto rounded-lg bg-[#DC2626] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Finalizando..." : "Finalizar prova"}
          </button>
        </aside>
      </div>
    </div>
  );
}
