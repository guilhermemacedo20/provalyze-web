"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { extractErrorMessage } from "@/lib/extract-error-message";
import {
  StudentAnalytics,
  StudentThemeAnalysis,
  reportService,
} from "@/services/report.service";

function formatScore(value: number | null) {
  if (value == null) return "-";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export default function StudentAnalyticsPage() {
  const { classId, studentId } = useParams<{
    classId: string;
    studentId: string;
  }>();
  const [report, setReport] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<StudentThemeAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    reportService
      .getStudentAnalytics(classId, studentId)
      .then((data) => {
        setReport(data);
      })
      .catch((error) => {
        setError(extractErrorMessage(error));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [classId, studentId]);

  useEffect(() => {
    if (!report || report.themes.length === 0) return;

    setAnalysisLoading(true);

    reportService
      .getStudentThemeAnalysis(classId, studentId)
      .then((data) => {
        setAnalysis(data);
      })
      .catch((cause) => {
        setAnalysisResult(extractErrorMessage(cause));
      })
      .finally(() => {
        setAnalysisLoading(false);
      });
  }, [report]);

  if (loading) {
    return (
      <div className="px-10 py-9">
        <p className="text-sm text-muted">Carregando...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="px-10 py-9">
        <p className="text-sm text-muted">
          {error || "Não foi possível carregar o analytics deste aluno."}
        </p>
        <Link
          href={`/classes/${classId}`}
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Voltar para a turma
        </Link>
      </div>
    );
  }

  const analysisMessage =
    report.themes.length === 0
      ? "Ainda não há desempenho por tema para analisar."
      : analysisLoading
        ? "Carregando..."
        : analysisResult;

  return (
    <div className="px-10 py-9">
      <p className="mb-5 text-xs text-muted">
        <Link href="/classes" className="hover:underline">
          Turmas
        </Link>
        {" / "}
        <Link href={`/classes/${classId}`} className="hover:underline">
          {report.className}
        </Link>
        {" / "}
        {report.studentName}
      </p>

      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          {report.studentName}
        </h1>
      </div>

      <div className="mb-6 flex gap-4">
        <article className="rounded-2xl border border-border bg-surface px-6 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Média geral
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {formatScore(report.totalAverage)}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-surface px-6 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Provas realizadas
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {report.finishedExams}
          </p>
        </article>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Desempenho por tema
          </h2>
          {report.themes.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Nenhuma resposta corrigida ainda.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {report.themes.map((theme) => {
                const strong = theme.percent >= 80;
                const tone = strong ? "bg-success" : "bg-warning";
                const text = strong ? "text-success" : "text-warning";
                return (
                  <li key={theme.name}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-foreground">{theme.name}</span>
                      <span className={`font-semibold ${text}`}>
                        {theme.percent}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-full rounded-full ${tone}`}
                        style={{ width: `${Math.min(theme.percent, 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="rounded-2xl bg-primary-light p-5">
          <h2 className="text-sm font-semibold text-primary">
            Dificuldades identificadas
          </h2>
          {analysis ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {analysis.difficulty}
              </p>
              <p className="mt-4 text-sm font-semibold text-primary">
                Recomendação pedagógica
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {analysis.recommendation}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">{analysisMessage}</p>
          )}
        </article>
      </div>

      <article className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Histórico de provas
        </h2>
        {report.exams.length === 0 ? (
          <p className="py-4 text-sm text-muted">Nenhuma prova realizada.</p>
        ) : (
          <ul>
            {report.exams.map((exam) => (
              <li
                key={`${exam.title}-${exam.finishedAt}`}
                className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm last:border-b-0"
              >
                <p className="text-foreground">
                  <span className="font-medium">{exam.title}</span>
                  <span className="text-muted">: {exam.subjectName}</span>
                  <span className="ml-3 text-muted">
                    {exam.finishedAt
                      ? new Date(exam.finishedAt).toLocaleString("pt-BR")
                      : ""}
                  </span>
                </p>
                <p className="shrink-0 font-semibold text-foreground">
                  {formatScore(exam.score)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <div className="mt-6 flex justify-end">
        <Link
          href={`/classes/${classId}`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>
    </div>
  );
}
