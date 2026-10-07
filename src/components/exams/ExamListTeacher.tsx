"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  ExamListItem,
  ExamStatus,
  examsService,
} from "@/services/exams.service";
import { formatPeriod, pluralize } from "@/lib/exam-format";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { ExamStatusBadge } from "./ExamStatusBadge";

type Tab = "ALL" | ExamStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: "ALL", label: "Todas" },
  { key: "DRAFT", label: "Rascunho" },
  { key: "PUBLISHED", label: "Publicada" },
  { key: "ENDED", label: "Encerrada" },
];

const unique = (values: string[]) => [...new Set(values)];

function describe(exam: ExamListItem) {
  const questions = pluralize(exam.questionsCount, "questão", "questões");
  if (exam.classes.length === 0) {
    return `Sem turma definida - ${questions}`;
  }

  const courses = unique(exam.classes.map((c) => c.courseName)).join(", ");
  const subjects = unique(exam.classes.map((c) => c.subjectName)).join(", ");
  const names = exam.classes.map((c) => c.name).join(", ");
  const label = exam.classes.length > 1 ? "Turmas" : "Turma";

  return `${courses} - ${subjects} - ${label}: ${names} - ${questions}`;
}

export function ExamListTeacher() {
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("ALL");

  const [deleteTarget, setDeleteTarget] = useState<ExamListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchExams = useCallback(async () => {
    try {
      setExams(await examsService.listExams());
      setLoadError(null);
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const counts = useMemo(() => {
    const result: Record<Tab, number> = {
      ALL: exams.length,
      DRAFT: 0,
      PUBLISHED: 0,
      ENDED: 0,
    };
    exams.forEach((exam) => {
      result[exam.status] += 1;
    });
    return result;
  }, [exams]);

  const visible = exams.filter((e) => tab === "ALL" || e.status === tab);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await examsService.deleteExam(deleteTarget.id);
      setDeleteTarget(null);
      await fetchExams();
    } catch (error) {
      setDeleteError(extractErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="px-10 py-9">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Minhas Provas</h1>
        <Link
          href="/exams/new"
          className="rounded-[14px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover"
        >
          + Nova prova
        </Link>
      </div>

      <div
        role="tablist"
        className="mb-6 inline-flex gap-1 rounded-lg border border-border bg-surface p-1"
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`cursor-pointer rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              tab === key
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {loadError && <p className="mb-4 text-[13px] text-danger">{loadError}</p>}
      {loading && <p className="text-[13px] text-muted">Carregando provas...</p>}

      {!loading && !loadError && visible.length === 0 && (
        <p className="rounded-[22px] border border-border bg-surface px-5 py-8 text-[13px] text-muted">
          {exams.length === 0
            ? "Você ainda não criou nenhuma prova. Clique em “+ Nova prova” para começar."
            : "Nenhuma prova nessa categoria."}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {visible.map((exam) => (
          <div
            key={exam.id}
            className="flex items-center gap-5 rounded-[22px] border border-border bg-surface px-6 py-5 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]"
          >
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[16px] font-semibold text-foreground">
                {exam.title}
              </h2>
              <p className="mt-1 truncate text-[13px] text-muted">
                {describe(exam)}
              </p>
              <p className="mt-0.5 text-[12px] text-muted">
                Período: {formatPeriod(exam.startsAt, exam.endsAt)}
              </p>
            </div>

            <ExamStatusBadge status={exam.status} />

            <Link
              href={`/exams/${exam.id}`}
              className="shrink-0 text-[13px] font-medium text-primary hover:underline"
            >
              Ver detalhes →
            </Link>

            <button
              type="button"
              aria-label={`Excluir prova ${exam.title}`}
              className="shrink-0 cursor-pointer"
              onClick={() => {
                setDeleteError(null);
                setDeleteTarget(exam);
              }}
            >
              <Image
                src="/icons/trash.png"
                alt=""
                width={20}
                height={20}
                className="size-5 object-contain opacity-70 hover:opacity-100"
              />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir prova"
        message={
          deleteTarget?.status === "PUBLISHED"
            ? `Excluir a prova "${deleteTarget.title}"? Ela está publicada e os alunos deixarão de vê-la.`
            : `Tem certeza que deseja excluir a prova "${deleteTarget?.title}"?`
        }
        error={deleteError}
        confirming={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}