"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Question, questionsService } from "@/services/questions.service";
import { Theme, themesService } from "@/services/themes.service";
import { Modal } from "@/components/layout/Modal";

const typeLabel = (type: Question["type"]) => {
  return type === "OPEN_ENDED" ? "Dissertativa" : "Objetiva";
};

export default function ThemeQuestionsPage() {
  const { id } = useParams<{ id: string }>();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | Question["type"]>("");
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(
    null,
  );

  const fetchData = async () => {
    try {
      const themeList = await themesService.getTheme(id);
      const questionsList = await questionsService.listQuestions();
      setTheme(themeList);
      setQuestions(questionsList.filter((question) => question.themeId === id));
    } catch (error) {
      console.error("Error loading theme:", error);
      setTheme(null);
    }
  };

  const confirmDelete = async () => {
    if (!questionToDelete || !questionToDelete.id) {
      return;
    }
    await questionsService.deleteQuestion(questionToDelete.id);
    setQuestionToDelete(null);
    fetchData();
  };

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((question) => {
      const matchesType = !typeFilter || question.type === typeFilter;
      const matchesSearch =
        !term || question.statement.toLowerCase().includes(term);
      return matchesType && matchesSearch;
    });
  }, [questions, search, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [id]);

  if (!theme) {
    return (
      <main className="px-10 pt-9">
        <p className="text-[13px] text-danger">Tema não encontrado.</p>
        <Link
          href="/questions"
          className="mt-3 inline-block text-[13px] text-primary"
        >
          Voltar ao banco de questões
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-surface px-10 pb-10 pt-9">
      <p className="text-[12px] text-muted">Banco de Questões / {theme.name}</p>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <label htmlFor="themeName" className="mr-3">
                Tema:
              </label>
              <input
                disabled
                value={theme.name}
                className="text-[13px] font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis border border-border rounded-[14px] px-4 py-2.5 mr-3 bg-background"
              />
            </div>
            <div className="flex items-center gap-3 my-4">
              <label htmlFor="questionType" className="mr-3">
                Tipo de questão:
              </label>
              <select
                value={typeFilter}
                className="my-4 h-[40px] rounded-[14px] border border-border bg-background px-4 py-2.5 text-[13px] text-center "
                onChange={(event) =>
                  setTypeFilter(event.target.value as "" | Question["type"])
                }
              >
                <option value="">Todos</option>
                <option value="MULTIPLE_CHOICE">Objetiva</option>
                <option value="OPEN_ENDED">Dissertativa</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-3 w-full rounded-[14px] border border-border px-4 py-2.5 text-foreground placeholder:text-muted"
              placeholder="Pesquisar..."
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/themes/${theme.id}/edit`}
            className="text-[13px] font-medium text-primary"
          >
            Editar tema
          </Link>
          <Link
            href={`/questions/create?themeId=${theme.id}`}
            className="rounded-[14px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover"
          >
            + Nova questão
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-border bg-surface shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
        <div className="flex gap-3 border-b border-border px-5 py-3 text-[11px] font-semibold text-muted">
          <span className="min-w-0 flex-1">QUESTÃO</span>
          <span className="w-[120px] shrink-0">TIPO</span>
          <span className="w-20 shrink-0" />
          <span className="w-20 shrink-0" />
        </div>

        {filteredQuestions.length === 0 ? (
          <p className="px-5 py-8 text-[13px] text-muted">
            Nenhuma questão neste tema.
          </p>
        ) : (
          filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="flex items-center gap-3 border-b border-border px-5 py-4 text-[13px] last:border-b-0"
            >
              <p className="min-w-0 flex-1 font-medium text-foreground">
                {question.statement}
              </p>
              <p className="w-[120px] shrink-0 text-muted">
                {typeLabel(question.type)}
              </p>
              <Link
                href={`/questions/${question.id}/edit`}
                className="w-20 shrink-0 font-medium text-primary"
              >
                Editar
              </Link>
              <button
                type="button"
                className="w-20 shrink-0 text-left font-medium text-danger cursor-pointer"
                onClick={() => setQuestionToDelete(question)}
              >
                Excluir
              </button>
            </div>
          ))
        )}
      </div>
      <Link
        href={"/questions"}
        className="rounded-[14px] bg-primary px-4 py-2.5 text-[13px] text-white hover:bg-primary-hover width-[120px] text-center self-end max-w-[120px]"
      >
        <span className="mr-2 font-bold">←</span> Voltar
      </Link>
      <Modal
        isOpen={questionToDelete !== null}
        setIsOpen={(open) => {
          if (!open) {
            setQuestionToDelete(null);
          }
        }}
        title="Confirmar exclusão"
        description={
          questionToDelete
            ? `Excluir a questão "${questionToDelete.statement}"?`
            : ""
        }
        onConfirm={confirmDelete}
      />
    </main>
  );
}
