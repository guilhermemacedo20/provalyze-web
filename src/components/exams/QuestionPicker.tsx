"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Question, questionsService } from "@/services/questions.service";
import { Theme, themesService } from "@/services/themes.service";
import { formatPoints, pluralize } from "@/lib/exam-format";
import { extractErrorMessage } from "@/lib/extract-error-message";
import {
  distributeEqually,
  parsePoints,
  round2,
  SelectedQuestion,
  sumPoints,
  typeLabel,
} from "./exam-wizard-types";

const THEME_COLORS = [
  { box: "bg-primary-light", link: "text-primary" },
  { box: "bg-[#fef1dd]", link: "text-warning" },
  { box: "bg-[#D8F5DD]", link: "text-[#3CAE63]" },
  { box: "bg-[#efe8fe]", link: "text-[#8b5cf6]" },
];

type Props = {
  selected: SelectedQuestion[];
  onChange: (next: SelectedQuestion[]) => void;
  openTheme: Theme | null;
  onOpenTheme: (theme: Theme | null) => void;
  totalScore: number;
};

export function QuestionPicker({
  selected,
  onChange,
  openTheme,
  onOpenTheme,
  totalScore,
}: Props) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([themesService.listThemes(), questionsService.listQuestions()])
      .then(([themeList, questions]) => {
        const byTheme: Record<string, number> = {};
        questions.forEach((q) => {
          byTheme[q.themeId] = (byTheme[q.themeId] ?? 0) + 1;
        });
        setThemes(themeList);
        setCounts(byTheme);
      })
      .catch((error) => setLoadError(extractErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex items-start gap-5">
      <div className="min-w-0 flex-1">
        {openTheme ? (
          <ThemeQuestions
            theme={openTheme}
            selected={selected}
            onCancel={() => onOpenTheme(null)}
            onApply={(next) => {
              onChange(next);
              onOpenTheme(null);
            }}
          />
        ) : (
          <>
            <p className="mb-5 text-[13px] text-muted">
              Escolha o tema para ver as questões desse assunto no banco de
              questões.
            </p>

            {loadError && (
              <p className="mb-4 text-[13px] text-danger">{loadError}</p>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {loading && (
                <p className="text-[13px] text-muted">Carregando temas...</p>
              )}

              {!loading && !loadError && themes.length === 0 && (
                <p className="rounded-lg border border-border bg-surface px-5 py-6 text-[13px] text-muted md:col-span-2">
                  Você ainda não tem temas. Crie uma pasta no Banco de Questões
                  para montar a prova.
                </p>
              )}

              {themes.map((theme, index) => {
                const color = THEME_COLORS[index % THEME_COLORS.length];
                const selectedInTheme = selected.filter(
                  (q) => q.themeId === theme.id,
                ).length;

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onOpenTheme(theme)}
                    className="min-w-0 cursor-pointer rounded-[22px] border border-border bg-surface p-5 text-left shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)] hover:border-primary/40"
                  >
                    <div
                      className={`mb-4 flex size-9 items-center justify-center rounded-[10px] ${color.box}`}
                    >
                      <Image
                        src="/icons/folder.svg"
                        alt=""
                        width={18}
                        height={18}
                      />
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="min-w-0 break-words text-[15px] font-semibold text-foreground">
                        {theme.name}
                      </h2>
                      <p className="shrink-0 text-[12px] text-muted">
                        {pluralize(
                          counts[theme.id] ?? 0,
                          "questão",
                          "questões",
                        )}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`text-[13px] font-medium ${color.link}`}
                      >
                        Selecionar tema →
                      </span>
                      {selectedInTheme > 0 && (
                        <span className="text-[12px] font-medium text-success">
                          {pluralize(
                            selectedInTheme,
                            "selecionada",
                            "selecionadas",
                          )}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <SelectedPanel
        selected={selected}
        onChange={onChange}
        totalScore={totalScore}
      />
    </div>
  );
}

function PointsInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
}) {
  const format = (v: number | null) =>
    v === null ? "" : String(v).replace(".", ",");

  const [text, setText] = useState(format(value));

  useEffect(() => {
    setText((prev) => (parsePoints(prev) === value ? prev : format(value)));
  }, [value]);

  return (
    <input
      aria-label="Pontos da questão"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parsePoints(e.target.value));
      }}
      placeholder="pts"
      className={`h-[28px] w-[64px] shrink-0 rounded-full border bg-surface px-2 text-center text-[12px] text-foreground placeholder:text-muted ${
        value === null ? "border-warning" : "border-primary"
      }`}
    />
  );
}

function SelectedPanel({
  selected,
  onChange,
  totalScore,
}: {
  selected: SelectedQuestion[];
  onChange: (next: SelectedQuestion[]) => void;
  totalScore: number;
}) {
  const [distributeMessage, setDistributeMessage] = useState<string | null>(
    null,
  );

  const sum = sumPoints(selected);
  const remaining = round2(totalScore - sum);
  const withoutPoints = selected.filter((q) => q.points === null).length;

  const setPoints = (questionId: string, points: number | null) => {
    setDistributeMessage(null);
    onChange(
      selected.map((q) => (q.questionId === questionId ? { ...q, points } : q)),
    );
  };

  const distribute = () => {
    const result = distributeEqually(selected, totalScore);
    if (typeof result === "string") {
      setDistributeMessage(result);
      return;
    }
    setDistributeMessage(null);
    onChange(result);
  };

  return (
    <aside className="w-[340px] shrink-0 rounded-[22px] border border-border bg-surface p-5 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
      <h3 className="mb-3 text-[14px] font-semibold text-foreground">
        Questões selecionadas ({selected.length})
      </h3>

      {selected.length === 0 ? (
        <p className="mb-4 text-[12px] text-muted">
          Nenhuma questão selecionada ainda.
        </p>
      ) : (
        <ul className="mb-3 flex flex-col gap-3">
          {selected.map((q) => (
            <li key={q.questionId} className="flex min-w-0 items-center gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[12px] text-foreground"
                  title={q.statement}
                >
                  {q.statement}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {typeLabel(q.type)} · {q.themeName}
                </p>
              </div>
              <PointsInput
                value={q.points}
                onChange={(points) => setPoints(q.questionId, points)}
              />
              <button
                type="button"
                aria-label={`Remover questão: ${q.statement}`}
                className="shrink-0 cursor-pointer text-muted hover:text-danger"
                onClick={() =>
                  onChange(selected.filter((s) => s.questionId !== q.questionId))
                }
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={distribute}
            className="w-full cursor-pointer rounded-md border border-primary px-3 py-2 text-[12px] font-semibold text-primary hover:bg-primary-light/40"
          >
            Distribuir igualmente
            {withoutPoints > 0 && withoutPoints < selected.length
              ? ` o restante (${withoutPoints} sem pontos)`
              : ""}
          </button>
          {distributeMessage && (
            <p className="mt-2 text-[12px] text-danger">{distributeMessage}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border py-2.5 text-[13px]">
        <span className="font-semibold text-foreground">
          Pontuação das questões
        </span>
        <span className="font-semibold text-primary">{formatPoints(sum)}</span>
      </div>
      <div className="flex items-center justify-between border-t border-border py-2.5 text-[13px]">
        <span className="font-semibold text-foreground">Total da prova</span>
        <span className="font-semibold text-primary">
          {formatPoints(totalScore)}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2.5 text-[13px]">
        <span className="font-semibold text-foreground">Restante</span>
        <span
          className={`font-semibold ${
            remaining < 0
              ? "text-danger"
              : remaining === 0
                ? "text-success"
                : "text-foreground"
          }`}
        >
          {formatPoints(remaining)}
        </span>
      </div>
    </aside>
  );
}

function ThemeQuestions({
  theme,
  selected,
  onCancel,
  onApply,
}: {
  theme: Theme;
  selected: SelectedQuestion[];
  onCancel: () => void;
  onApply: (next: SelectedQuestion[]) => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [checked, setChecked] = useState<Set<string>>(
    () =>
      new Set(
        selected.filter((q) => q.themeId === theme.id).map((q) => q.questionId),
      ),
  );

  useEffect(() => {
    questionsService
      .listQuestions(theme.id)
      .then(setQuestions)
      .catch((error) => setLoadError(extractErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [theme.id]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter(
      (q) => !term || q.statement.toLowerCase().includes(term),
    );
  }, [questions, search]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const apply = () => {
    const kept = selected.filter(
      (s) => s.themeId !== theme.id || checked.has(s.questionId),
    );
    const alreadyIn = new Set(kept.map((s) => s.questionId));

    const added: SelectedQuestion[] = questions
      .filter((q) => q.id && checked.has(q.id) && !alreadyIn.has(q.id))
      .map((q) => ({
        questionId: q.id as string,
        points: null,
        statement: q.statement,
        themeId: theme.id,
        themeName: theme.name,
        type: q.type,
      }));

    onApply([...kept, ...added]);
  };

  return (
    <div>
      <div className="rounded-[22px] border border-border bg-surface p-5 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
        <h2 className="mb-1 break-words text-[14px] font-semibold text-foreground">
          Banco de questões — {theme.name}
        </h2>
        <p className="mb-3 text-[12px] text-muted">
          Marque as questões e clique em Adicionar. Os pontos de cada uma são
          definidos no painel ao lado.
        </p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          className="mb-5 w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted"
        />

        {loading && <p className="py-4 text-[13px] text-muted">Carregando...</p>}
        {loadError && (
          <p className="py-4 text-[13px] text-danger">{loadError}</p>
        )}
        {!loading && !loadError && visible.length === 0 && (
          <p className="py-4 text-[13px] text-muted">
            {questions.length === 0
              ? "Nenhuma questão neste tema. Cadastre questões no Banco de Questões."
              : "Nenhuma questão encontrada para essa busca."}
          </p>
        )}

        {visible.map((q) => {
          const id = q.id as string;
          const isChecked = checked.has(id);

          return (
            <div
              key={id}
              className="flex min-w-0 items-center gap-3 border-b border-border px-1 py-2.5 last:border-b-0"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                aria-label={`Selecionar questão: ${q.statement}`}
                onClick={() => toggle(id)}
                className={`flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border ${
                  isChecked
                    ? "border-primary bg-primary text-white"
                    : "border-disabled bg-surface"
                }`}
              >
                {isChecked && <Check size={10} strokeWidth={3} />}
              </button>

              <p className="min-w-0 flex-1 break-words text-[13px] text-foreground">
                {q.statement}
              </p>

              <span className="w-[100px] shrink-0 text-right text-[12px] text-muted">
                {typeLabel(q.type)}
              </span>
            </div>
          );
        })}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={apply}
            disabled={loading || !!loadError}
            className="cursor-pointer rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Adicionar
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="mt-5 cursor-pointer text-sm font-medium text-muted hover:text-foreground"
      >
        ← Voltar: Temas
      </button>
    </div>
  );
}