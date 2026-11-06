"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { QuestionImage } from "@/components/questions/QuestionImage";
import { Question, questionsService } from "@/services/questions.service";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { typeLabel } from "./exam-wizard-types";

type Props = {
  question: Question;
  themeName: string;
  onClose: () => void;
};

export function QuestionPreviewModal({ question, themeName, onClose }: Props) {
  const [detail, setDetail] = useState<Question | null>(null);
  const [loading, setLoading] = useState(Boolean(question.id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!question.id) return;

    let cancelled = false;
    questionsService
      .getQuestion(question.id)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [question.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const current = detail ?? question;
  const options = detail?.questionOptions ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Questão completa"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85vh] w-full max-w-[720px] overflow-y-auto rounded-[22px] bg-surface p-7 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <p className="text-[12px] text-muted">
            {typeLabel(current.type)} · {themeName}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 cursor-pointer rounded-lg p-1 text-muted hover:bg-background hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-5 whitespace-pre-wrap break-words text-justify text-[15px] leading-relaxed text-foreground">
          {current.statement}
        </p>

        {current.imageUrl && (
          <div className="mb-5">
            <QuestionImage
              src={current.imageUrl}
              alt="Imagem da questão"
              className="max-h-80 max-w-full rounded-xl object-contain"
            />
          </div>
        )}

        {loading && (
          <p className="text-[13px] text-muted">Carregando alternativas...</p>
        )}
        {error && <p className="text-[13px] text-danger">{error}</p>}

        {options.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {options.map((option) => (
              <li
                key={option.label}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-[14px] ${
                  option.isCorrect
                    ? "border-[#16A34A] bg-[#DCFCE7]"
                    : "border-border"
                }`}
              >
                <span className="font-semibold text-foreground">
                  {option.label})
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-foreground">
                  {option.text}
                </span>
                {option.isCorrect && (
                  <span className="shrink-0 text-[12px] font-semibold text-[#16A34A]">
                    Correta
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}