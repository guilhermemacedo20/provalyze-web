"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ExamDetail,
  ExamOverview,
  examsService,
} from "@/services/exams.service";
import {
  formatFullPeriod,
  formatPoints,
  formatScore,
  initials,
} from "@/lib/exam-format";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { ExamStatusBadge, StudentStatusBadge } from "./ExamStatusBadge";
import { round2, typeLabel } from "./exam-wizard-types";

type Tab = "overview" | "questions";

const cardShadow = "shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className={`min-w-[110px] rounded-[22px] border border-border bg-surface px-5 py-4 ${cardShadow}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-[28px] font-bold leading-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

export function ExamDetailTeacher({ examId }: { examId: string }) {
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [overview, setOverview] = useState<ExamOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [examData, overviewData] = await Promise.all([
        examsService.getExam(examId),
        examsService.getOverview(examId),
      ]);
      setExam(examData);
      setOverview(overviewData);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    load();
  }, [load]);

  const publish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      await examsService.publishExam(examId);
      await load();
    } catch (err) {
      setPublishError(extractErrorMessage(err));
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="px-10 py-9">
        <p className="text-[13px] text-muted">Carregando prova...</p>
      </div>
    );
  }

  if (error || !exam || !overview) {
    return (
      <div className="px-10 py-9">
        <p className="text-[14px] text-danger">
          {error ?? "Prova não encontrada."}
        </p>
        <Link
          href="/exams"
          className="mt-3 inline-block text-[13px] font-medium text-primary hover:underline"
        >
          Voltar para Provas
        </Link>
      </div>
    );
  }

  const classNames = exam.classes.map((c) => c.name).join(", ") || "Sem turma";
  const isDraft = exam.status === "DRAFT";

  const pointsSum = round2(exam.totalPoints);
  const pointsTotal = round2(exam.targetScore);
  const pointsDiff = round2(pointsTotal - pointsSum);
  const pointsOk = pointsDiff === 0;

  return (
    <div className="px-10 py-9">
      <p className="mb-2 text-xs text-muted">
        <Link href="/exams" className="hover:underline">
          Provas
        </Link>{" "}
        / {exam.title}
      </p>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
            <ExamStatusBadge status={exam.status} />
          </div>
          <p className="mt-1 text-[13px] text-muted">
            {classNames} · {formatFullPeriod(exam.startsAt, exam.endsAt)} ·
            Professor(a) {exam.teacherName}
            {exam.durationMinutes
              ? ` · ${exam.durationMinutes} min de prova`
              : ""}
          </p>
        </div>

        {isDraft && (
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={`/exams/${exam.id}/edit`}
              className="rounded-md border border-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-foreground hover:bg-background"
            >
              Editar
            </Link>
            <button
              type="button"
              onClick={publish}
              disabled={publishing || !pointsOk}
              title={
                pointsOk
                  ? undefined
                  : "A soma dos pontos precisa ser igual ao total da prova"
              }
              className="cursor-pointer rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {publishing ? "Publicando..." : "Publicar prova ✓"}
            </button>
          </div>
        )}
      </div>

      {publishError && (
        <p className="mt-3 text-[13px] text-danger">{publishError}</p>
      )}
      {isDraft && (
        <p className="mt-4 rounded-lg border border-[#fde7b8] bg-[#fef1dd] px-4 py-3 text-[13px] text-[#8a5a00]">
          Esta prova é um rascunho: os alunos só poderão vê-la depois que você
          publicar.
        </p>
      )}
      {isDraft && !pointsOk && (
        <p className="mt-3 rounded-lg border border-[#fde7b8] bg-[#fef1dd] px-4 py-3 text-[13px] text-[#8a5a00]">
          {pointsDiff > 0
            ? `Faltam ${formatPoints(pointsDiff)} para fechar o total da prova (${formatPoints(pointsTotal)}). Clique em Editar para ajustar os pontos antes de publicar.`
            : `A soma das questões passou ${formatPoints(Math.abs(pointsDiff))} do total da prova (${formatPoints(pointsTotal)}). Clique em Editar para ajustar.`}
        </p>
      )}

      <div
        role="tablist"
        className="mb-6 mt-5 inline-flex gap-1 rounded-lg border border-border bg-surface p-1"
      >
        {(
          [
            ["overview", "Visão geral"],
            ["questions", "Questões"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
              tab === key
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          disabled
          title="Disponível quando houver provas corrigidas"
          className="cursor-not-allowed rounded-md px-4 py-1.5 text-[13px] font-medium text-disabled"
        >
          Desempenho
        </button>
      </div>

      {tab === "overview" && (
        <>
          <div className="mb-6 flex flex-wrap gap-4">
            <StatCard
              label="Questões"
              value={String(overview.stats.questionsCount)}
            />
            <StatCard
              label="Pontos"
              value={
                pointsOk
                  ? formatPoints(pointsTotal)
                  : `${formatPoints(pointsSum)} de ${formatPoints(pointsTotal)}`
              }
            />
            <StatCard
              label="Alunos"
              value={String(overview.stats.studentsCount)}
            />
            <StatCard label="Média" value={formatScore(overview.stats.average)} />
            <StatCard
              label="Taxa de conclusão"
              value={`${overview.stats.completionRate}%`}
            />
          </div>

          <div
            className={`overflow-hidden rounded-[22px] border border-border bg-surface ${cardShadow}`}
          >
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-muted">
                  <th className="px-5 py-3">ALUNO</th>
                  <th className="px-5 py-3">STATUS</th>
                  <th className="px-5 py-3">NOTA</th>
                  <th className="px-5 py-3">TEMPO</th>
                  <th className="px-5 py-3">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {overview.students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-muted">
                      Nenhum aluno nas turmas desta prova.
                    </td>
                  </tr>
                )}
                {overview.students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-6 items-center justify-center rounded-full bg-primary-light text-[9px] font-bold text-primary">
                          {initials(student.name)}
                        </span>
                        <span className="font-medium text-foreground">
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StudentStatusBadge status={student.status} />
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {formatScore(student.score)}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {student.durationMinutes !== null
                        ? `${student.durationMinutes} min`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {student.status === "FINISHED" && (
                        <span
                          className="cursor-not-allowed font-medium text-primary/50"
                          title="Disponível com o módulo de correção"
                        >
                          Corrigir
                        </span>
                      )}
                      {student.status === "GRADED" && (
                        <span
                          className="cursor-not-allowed font-medium text-primary/50"
                          title="Disponível com o módulo de correção"
                        >
                          Ver detalhes
                        </span>
                      )}
                      {student.status !== "FINISHED" &&
                        student.status !== "GRADED" && (
                          <span className="text-muted">—</span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "questions" && (
        <div
          className={`overflow-hidden rounded-[22px] border border-border bg-surface ${cardShadow}`}
        >
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-muted">
                <th className="w-12 px-5 py-3">#</th>
                <th className="px-5 py-3">QUESTÃO</th>
                <th className="px-5 py-3">TIPO</th>
                <th className="px-5 py-3">TEMA</th>
                <th className="px-5 py-3">PONTOS</th>
                <th className="px-5 py-3">% ACERTO</th>
              </tr>
            </thead>
            <tbody>
              {exam.questions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">
                    Nenhuma questão nesta prova.
                  </td>
                </tr>
              )}
              {exam.questions.map((q, index) => (
                <tr
                  key={q.examQuestionId}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-5 py-3.5 text-muted">{index + 1}</td>
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {q.statement}
                  </td>
                  <td className="px-5 py-3.5 text-muted">{typeLabel(q.type)}</td>
                  <td className="px-5 py-3.5 text-muted">{q.themeName}</td>
                  <td className="px-5 py-3.5 text-muted">
                    {formatPoints(q.points)}
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {q.correctRate === null ? "—" : `${q.correctRate}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link
        href="/exams"
        className="mt-6 inline-block rounded-[14px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover"
      >
        ← Voltar
      </Link>
    </div>
  );
}