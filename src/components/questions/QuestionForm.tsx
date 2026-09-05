"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  QuestionOption,
  QuestionPayload,
  QuestionType,
  questionsService,
} from "@/services/questions.service";
import { Theme, themesService } from "@/services/themes.service";
import { Modal } from "../layout/Modal";

const maxLabels = ["A", "B", "C", "D", "E", "F"];

const emptyOptions: QuestionOption[] = [
  { label: "A", text: "", isCorrect: true },
  { label: "B", text: "", isCorrect: false },
];

const withLabels = (options: QuestionOption[]): QuestionOption[] => {
  return options.map((option, index) => ({
    ...option,
    label: maxLabels[index],
  }));
};

export function QuestionForm({ questionId }: { questionId?: string }) {
  const router = useRouter();
  const isEdit = !!questionId;
  const [statement, setStatement] = useState("");
  const [themeId, setThemeId] = useState("");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [type, setType] = useState<QuestionType>("MULTIPLE_CHOICE");
  const [options, setOptions] = useState<QuestionOption[]>(
    withLabels(emptyOptions),
  );
  const [error, setError] = useState<string | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const themeList = await themesService.listThemes();
        setThemes(themeList);

        if (!questionId) {
          const fromQuery = new URLSearchParams(window.location.search).get(
            "themeId",
          );
          if (fromQuery) {
            setThemeId(fromQuery);
          }
          return;
        }

        const question = await questionsService.getQuestion(questionId);
        setStatement(question.statement);
        setThemeId(question.themeId);
        setType(question.type);
        if (question.type === "MULTIPLE_CHOICE") {
          setOptions(
            withLabels(
              question.questionOptions ?? question.options ?? emptyOptions,
            ),
          );
        }
      } catch (err) {
        console.error("Error loading question:", err);
        setError("Não foi possível carregar os dados da questão.");
      }
    };

    load();
  }, [questionId]);

  const updateOption = (index: number, newOption: Partial<QuestionOption>) => {
    setOptions((current) =>
      withLabels(
        current.map((option, actualIndex) =>
          actualIndex === index ? { ...option, ...newOption } : option,
        ),
      ),
    );
  };

  const markCorrect = (index: number) => {
    setOptions((current) =>
      withLabels(
        current.map((option, actualIndex) => ({
          ...option,
          isCorrect: actualIndex === index,
        })),
      ),
    );
  };

  const addOption = () => {
    setOptions((current) =>
      withLabels([...current, { label: "", text: "", isCorrect: false }]),
    );
  };

  const removeOption = (index: number) => {
    setOptions((current) => {
      const newOptions = current.filter(
        (_, actualIndex) => actualIndex !== index,
      );
      return withLabels(newOptions);
    });
  };

  const onSubmit = async (
    event: React.FormEvent | null = null,
    keepOnPage: boolean = false,
  ) => {
    if (event) {
      event.preventDefault();
    }
    setError(null);

    if (!statement || !themeId) {
      setError("Preencha enunciado e tema.");
      return;
    }

    if (type === "MULTIPLE_CHOICE") {
      if (options.length < 2) {
        setError("Objetiva precisa de pelo menos 2 alternativas.");
        return;
      }
      if (options.some((option) => !option.text)) {
        setError("Preencha o texto de todas as alternativas.");
        return;
      }
      if (options.filter((option) => option.isCorrect).length !== 1) {
        setError("Selecione uma alternativa como correta.");
        return;
      }
    }

    const correct = options.find((option) => option.isCorrect);

    const payload: QuestionPayload = {
      statement: statement.trim(),
      themeId,
      type,
      ...(type === "MULTIPLE_CHOICE"
        ? {
            options: options.map((option) => ({
              label: option.label,
              text: option.text,
              isCorrect: option.isCorrect,
            })),
            correctOption: correct?.label,
          }
        : {}),
    };

    try {
      if (questionId) {
        await questionsService.updateQuestion(questionId, payload);
      } else {
        await questionsService.createQuestion(payload);
      }
      if (keepOnPage) {
        setStatement("");
        setType("MULTIPLE_CHOICE");
        setOptions(withLabels(emptyOptions));
      } else {
        router.push(`/themes/${themeId}`);
      }
    } catch (err) {
      console.error("Error saving question:", err);
      setError(
        questionId
          ? "Não foi possível atualizar a questão."
          : "Não foi possível criar a questão.",
      );
    }
  };

  const confirmDelete = async () => {
    if (!questionToDelete) {
      return;
    }
    try {
      await questionsService.deleteQuestion(questionToDelete);
      router.push("/themes/" + themeId);
    } catch (err) {
      console.error("Error deleting question:", err);
      setError("Não foi possível excluir a questão.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-surface px-10 pb-10 pt-9">
      <p className="text-[12px] text-muted">
        Banco de Questões / {isEdit ? "Editar" : "Nova questão"}
      </p>

      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold text-foreground">
          {isEdit ? "Editar questão" : "Nova questão"}
        </h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-[728px] space-y-5 rounded-[22px] border border-border bg-surface p-7 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]"
      >
        <div className="space-y-1.5">
          <label htmlFor="statement" className="block text-[13px] font-medium">
            Enunciado
          </label>
          <textarea
            id="statement"
            required
            rows={4}
            value={statement}
            onChange={(event) => setStatement(event.target.value)}
            className="w-full rounded-[14px] border border-border bg-surface px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="themeId" className="block text-[13px] font-medium">
            Tema
          </label>
          {themes.length === 0 ? (
            <p className="text-[13px] text-muted">
              Nenhum tema cadastrado.{" "}
              <Link href="/themes/create" className="font-medium text-primary">
                Criar tema
              </Link>
            </p>
          ) : (
            <select
              id="themeId"
              required
              value={themeId}
              onChange={(event) => setThemeId(event.target.value)}
              className="w-full rounded-[14px] border border-border bg-surface px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted"
            >
              <option value="">Selecione um tema</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="type" className="block text-[13px] font-medium">
            Tipo
          </label>
          <select
            id="type"
            value={type}
            onChange={(event) => setType(event.target.value as QuestionType)}
            className="w-full rounded-[14px] border border-border bg-surface px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted"
          >
            <option value="MULTIPLE_CHOICE">Objetiva</option>
            <option value="OPEN_ENDED">Dissertativa</option>
          </select>
        </div>

        {type === "MULTIPLE_CHOICE" && (
          <fieldset className="space-y-3">
            <legend className="text-[13px] font-medium">Alternativas</legend>
            {options.map((option, actualIndex) => (
              <div key={option.label} className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-[13px] font-medium">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={option.isCorrect}
                    onChange={() => markCorrect(actualIndex)}
                  />
                  {option.label}
                </label>
                <input
                  type="text"
                  value={option.text}
                  onChange={(event) =>
                    updateOption(actualIndex, { text: event.target.value })
                  }
                  placeholder={`Texto da alternativa ${option.label}`}
                  className="w-full rounded-[14px] border border-border bg-surface px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(actualIndex)}
                    className="shrink-0 text-[13px] font-medium text-danger cursor-pointer"
                  >
                    Excluir
                  </button>
                )}
              </div>
            ))}
            {options.length < maxLabels.length && (
              <button
                type="button"
                onClick={addOption}
                className="text-[13px] font-medium text-primary cursor-pointer"
              >
                + Adicionar alternativa
              </button>
            )}
          </fieldset>
        )}

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() =>
              router.push(themeId ? `/themes/${themeId}` : "/questions")
            }
            className="text-[13px] font-medium text-muted cursor-pointer hover:text-foreground"
          >
            Voltar
          </button>
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={() => themeId && setQuestionToDelete(questionId)}
                className="rounded-[14px] bg-danger px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-danger-hover disabled:opacity-50 cursor-pointer mr-3"
              >
                Excluir
              </button>
            )}
            {!isEdit && (
              <button
                type="button"
                onClick={() => onSubmit(null, true)}
                className="rounded-[14px] bg-secondary px-4 py-2.5 text-[13px] font-semibold text-black hover:bg-secondary-hover disabled:opacity-50 cursor-pointer mr-3 border border-border"
              >
                Salvar e adicionar outra
              </button>
            )}
            <button
              type="submit"
              className="rounded-[14px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
            >
              {isEdit ? "Salvar alterações" : "Criar"}
            </button>
          </div>
        </div>
      </form>
      <Modal
        isOpen={!!questionToDelete}
        setIsOpen={() => setQuestionToDelete(null)}
        title="Excluir questão"
        description="Tem certeza que deseja excluir esta questão?"
        onConfirm={confirmDelete}
      />
    </main>
  );
}
