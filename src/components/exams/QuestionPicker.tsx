"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Question, questionsService } from "@/services/questions.service";
import { Theme, themesService } from "@/services/themes.service";
import { formatPoints, pluralize } from "@/lib/exam-format";
import { extractErrorMessage } from "@/lib/extract-error-message";
import {
  EXAM_TOTAL_SCORE,
  parsePoints,
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
};

export function QuestionPicker({
  selected,
  onChange,
  openTheme,
  onOpenTheme,
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

  if (openTheme) {
    return (
      <ThemeQuestions
        theme={openTheme}
        selected={selected}
        onCancel={() => onOpenTheme(null)}
        onApply={(next) => {
          onChange(next);
          onOpenTheme(null);
        }}
      />
    );
  }

  return (
    <div>
      <p className="mb-5 text-[13px] text-muted">
        Escolha o tema para ver as questões desse assunto no banco de questões.
      </p>

      {loadError && <p className="mb-4 text-[13px] text-danger">{loadError}</p>}

      <div className="flex items-start gap-5">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 md:grid-cols-2">
          {loading && <p className="text-[13px] text-muted">Carregando temas...</p>}

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
                className="cursor-pointer rounded-[22px] border border-border bg-surface p-5 text-left shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)] hover:border-primary/40"
              >
                <div
                  className={`mb-4 flex size-9 items-center justify-center rounded-[10px] ${color.box}`}
                >
                  <Image src="/icons/folder.svg" alt="" width={18} height={18} />
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[15px] font-semibold text-foreground">
                    {theme.name}
                  </h2>
                  <p className="shrink-0 text-[12px] text-muted">
                    {pluralize(counts[theme.id] ?? 0, "questão", "questões")}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-[13px] font-medium ${color.link}`}>
                    Selecionar tema →
                  </span>
                  {selectedInTheme > 0 && (
                    <span className="text-[12px] font-medium text-success">
                      {pluralize(selectedInTheme, "selecionada", "selecionadas")}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <SelectedPanel selected={selected} onChange={onChange} />
      </div>
    </div>
  );
}

function SelectedPanel({
  selected,
  onChange,
}: {
  selected: SelectedQuestion[];
  onChange: (next: SelectedQuestion[]) => void;
}) {
  return (
    <aside className="w-[320px] shrink-0 rounded-[22px] border border-border bg-surface p-5 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
      <h3 className="mb-3 text-[14px] font-semibold text-foreground">
        Questões selecionadas ({selected.length})
      </h3>

      {selected.length === 0 ? (
        <p className="mb-4 text-[12px] text-muted">
          Nenhuma questão selecionada ainda.
        </p>
      ) : (
        <ul className="mb-4 flex flex-col gap-2">
          {selected.map((q) => (
            <li
              key={q.questionId}
              className="flex items-center gap-2 text-[12px] text-foreground"
            >
              <span className="min-w-0 flex-1 truncate" title={q.statement}>
                {q.statement}
              </span>
              <span className="shrink-0 text-muted">
                ({formatPoints(q.points)})
              </span>
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

      <div className="flex items-center justify-between border-t border-border py-2.5 text-[13px]">
        <span className="font-semibold text-foreground">Pontuação total</span>
        <span className="font-semibold text-primary">
          {formatPoints(sumPoints(selected))}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2.5 text-[13px]">
        <span className="font-semibold text-foreground">
          Pontuação total da prova
        </span>
        <span className="font-semibold text-primary">
          {formatPoints(EXAM_TOTAL_SCORE)}
        </span>
      </div>
    </aside>
  );
}

// questões de um tema 

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
  const [formError, setFormError] = useState<string | null>(null);

  // questionId -> pontos digitados (só existe para as questões marcadas)
  const [checked, setChecked] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    selected
      .filter((q) => q.themeId === theme.id)
      .forEach((q) => {
        initial[q.questionId] = String(q.points).replace(".", ",");
      });
    return initial;
  });

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
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = "1";
      return next;
    });
  };

  const apply = () => {
    setFormError(null);

    const chosen = questions.filter((q) => q.id && q.id in checked);
    for (const q of chosen) {
      if (parsePoints(checked[q.id as string]) === null) {
        setFormError(
          "Informe os pontos (maior que zero) de cada questão marcada.",
        );
        return;
      }
    }

    const chosenIds = new Set(chosen.map((q) => q.id as string));
    const pointsById = new Map(
      chosen.map((q) => [q.id as string, parsePoints(checked[q.id as string])!]),
    );

    const kept = selected
      .filter((s) => s.themeId !== theme.id || chosenIds.has(s.questionId))
      .map((s) =>
        s.themeId === theme.id
          ? { ...s, points: pointsById.get(s.questionId) ?? s.points }
          : s,
      );
    const alreadyIn = new Set(kept.map((s) => s.questionId));
    const added: SelectedQuestion[] = chosen
      .filter((q) => !alreadyIn.has(q.id as string))
      .map((q) => ({
        questionId: q.id as string,
        points: pointsById.get(q.id as string)!,
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
        <h2 className="mb-3 text-[14px] font-semibold text-foreground">
          Banco de questões — {theme.name}
        </h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          className="mb-5 w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted"
        />

        <div className="mb-1 flex items-center gap-3 px-1 text-[12px] font-semibold text-foreground">
          <span className="flex-1" />
          <span className="w-[84px] text-center">Pontos</span>
          <span className="w-[160px]" />
        </div>

        {loading && <p className="py-4 text-[13px] text-muted">Carregando...</p>}
        {loadError && <p className="py-4 text-[13px] text-danger">{loadError}</p>}
        {!loading && !loadError && visible.length === 0 && (
          <p className="py-4 text-[13px] text-muted">
            {questions.length === 0
              ? "Nenhuma questão neste tema. Cadastre questões no Banco de Questões."
              : "Nenhuma questão encontrada para essa busca."}
          </p>
        )}

        {visible.map((q) => {
          const id = q.id as string;
          const isChecked = id in checked;

          return (
            <div
              key={id}
              className="flex items-center gap-3 border-b border-border px-1 py-2.5 last:border-b-0"
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

              <p className="min-w-0 flex-1 text-[13px] text-foreground">
                {q.statement}
              </p>

              <input
                aria-label="Pontos da questão"
                inputMode="decimal"
                disabled={!isChecked}
                value={isChecked ? checked[id] : ""}
                onChange={(e) =>
                  setChecked((prev) => ({ ...prev, [id]: e.target.value }))
                }
                placeholder="pts"
                className="h-[26px] w-[84px] rounded-full border border-primary bg-surface px-2 text-center text-[12px] text-foreground placeholder:text-muted disabled:border-border disabled:bg-background"
              />

              <span className="w-[160px] shrink-0 text-right text-[12px] text-muted">
                {typeLabel(q.type)} · {theme.name}
              </span>
            </div>
          );
        })}

        {formError && <p className="mt-3 text-[13px] text-danger">{formError}</p>}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={apply}
            disabled={loading || !!loadError}
            className="cursor-pointer rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
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