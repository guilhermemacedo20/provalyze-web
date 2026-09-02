"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  QuestionOption,
  QuestionType,
  questionsService,
} from "@/services/questions.service";

const maxLabels = ["A", "B", "C", "D", "E", "F"];

const emptyOptions: QuestionOption[] = [
  { label: "A", text: "", isCorrect: true },
  { label: "B", text: "", isCorrect: false },
];

function withLabels(options: QuestionOption[]): QuestionOption[] {
  return options.map((option, index) => ({
    ...option,
    label: maxLabels[index],
  }));
}

export function QuestionForm({ questionId }: { questionId?: string }) {
  const router = useRouter();
  const isEdit = !!questionId;
  const [statement, setStatement] = useState("");
  const [theme, setTheme] = useState("");
  const [type, setType] = useState<QuestionType>("MULTIPLE_CHOICE");
  const [options, setOptions] = useState<QuestionOption[]>(
    withLabels(emptyOptions),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("QuestionForm mounted with questionId:", questionId);
    if (!questionId) {
      return;
    }
    console.log("Loading question with ID:", questionId);
    async function loadQuestion() {
      try {
        if (!questionId) {
          return;
        }
        setLoading(true);
        const question = await questionsService.getQuestion(questionId);

        setStatement(question.statement);
        setTheme(question.theme);
        setType(question.type);
        if (question.type === "MULTIPLE_CHOICE") {
          {
            setOptions(
              withLabels(
                question.questionOptions ?? question.options ?? emptyOptions,
              ),
            );
          }
        }
      } catch (err) {
        console.error("Error loading question:", err);
      } finally {
        setLoading(false);
      }
    }

    loadQuestion();
  }, []);

  function updateOption(index: number, newOption: Partial<QuestionOption>) {
    setOptions((current) =>
      withLabels(
        current.map((option, actualIndex) =>
          actualIndex === index ? { ...option, ...newOption } : option,
        ),
      ),
    );
  }

  function markCorrect(index: number) {
    setOptions((current) =>
      withLabels(
        current.map((option, actualIndex) => ({
          ...option,
          isCorrect: actualIndex === index,
        })),
      ),
    );
  }

  function addOption() {
    setOptions((current) =>
      withLabels([...current, { label: "", text: "", isCorrect: false }]),
    );
  }

  function removeOption(index: number) {
    setOptions((current) => {
      const newOptions = current.filter(
        (_, actualIndex) => actualIndex !== index,
      );
      return withLabels(newOptions);
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!statement || !theme) {
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
    const payload = {
      statement: statement.trim(),
      theme: theme.trim(),
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

    setPending(true);
    try {
      if (questionId) {
        await questionsService.updateQuestion(questionId, payload);
      } else {
        await questionsService.createQuestion(payload);
      }
      router.push("/questions");
    } catch (err) {
      console.error("Error saving question:", err);
      setError(
        questionId
          ? "Não foi possível atualizar a questão."
          : "Não foi possível criar a questão.",
      );
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p className="p-8">Carregando questão...</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4 p-8">
      <h1 className="text-xl font-semibold">
        {isEdit ? "Editar questão" : "Criação de questões"}
      </h1>

      <div className="space-y-1">
        <label htmlFor="statement" className="block text-sm">
          Enunciado
        </label>
        <textarea
          id="statement"
          required
          rows={4}
          value={statement}
          onChange={(event) => setStatement(event.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="theme" className="block text-sm">
          Tema
        </label>
        <input
          id="theme"
          type="text"
          required
          value={theme}
          onChange={(event) => setTheme(event.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="type" className="block text-sm">
          Tipo
        </label>
        <select
          id="type"
          value={type}
          onChange={(event) => setType(event.target.value as QuestionType)}
          className="w-full rounded border px-3 py-2"
        >
          <option value="MULTIPLE_CHOICE">Objetiva</option>
          <option value="OPEN_ENDED">Dissertativa</option>
        </select>
      </div>

      {type === "MULTIPLE_CHOICE" && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Alternativas</legend>
          {options.map((option, actualIndex) => (
            <div key={option.label} className="flex items-start gap-2">
              <label className="mt-2 flex items-center gap-1 text-sm">
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
                className="flex-1 rounded border px-3 py-2"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(actualIndex)}
                  className="mt-1 text-sm underline"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
          {options.length < maxLabels.length && (
            <button
              type="button"
              onClick={addOption}
              className="text-sm underline"
            >
              Adicionar nova alternativa
            </button>
          )}
        </fieldset>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          {pending
            ? "Salvando..."
            : isEdit
              ? "Salvar alterações"
              : "Criar questão"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/questions")}
          className="rounded px-4 py-2 underline"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
