"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { PerformanceReport, reportService } from "@/services/report.service";
import { formatAverage } from "@/utils/formatFunctions";

function themeTone(percent: number) {
  if (percent >= 70) {
    return { bar: "bg-success", text: "text-success" };
  }
  if (percent >= 50) {
    return { bar: "bg-warning", text: "text-warning" };
  }
  return { bar: "bg-danger", text: "text-danger" };
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none rounded-full border border-border bg-surface py-2 pl-4 pr-9 text-sm text-foreground"
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
      />
    </label>
  );
}

export default function AnalyticsPage() {
  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    reportService
      .getGeneralAnalytics(classId, examId)
      .then((data) => {
        setReport(data);
      })
      .catch((error) => {
        setError(extractErrorMessage(error));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [classId, examId]);

  return (
    <div className="px-10 py-9">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Desempenho</h1>
        <div className="flex flex-wrap gap-3">
          <FilterSelect
            label="Turma"
            value={classId}
            onChange={(value) => {
              setClassId(value);
              setExamId("");
            }}
          >
            <option value="">Turma: Todas</option>
            {report?.classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                Turma: {schoolClass.name} · {schoolClass.subjectName}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Prova" value={examId} onChange={setExamId}>
            <option value="">Prova: Todas</option>
            {report?.exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                Prova: {exam.title}
              </option>
            ))}
          </FilterSelect>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="mb-6 flex flex-wrap gap-4">
        <article className="flex rounded-2xl border border-border bg-surface">
          <div className="px-8 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Média
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {loading && !report
                ? "..."
                : formatAverage(report?.average, loading)}
            </p>
          </div>
          <div className="px-8 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Mediana
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {loading && !report
                ? "..."
                : formatAverage(report?.median, loading)}
            </p>
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-surface px-8 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Taxa de acerto
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {loading && !report
              ? "..."
              : report?.hitRate == null
                ? "-"
                : `${report.hitRate}%`}
          </p>
        </article>
      </div>

      <article className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Desempenho por tema
        </h2>
        {loading && !report ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : !report || report.themes.length === 0 ? (
          <p className="text-sm text-muted">
            Nenhuma resposta corrigida nesse filtro.
          </p>
        ) : (
          <ul className="space-y-4">
            {report.themes.map((theme) => {
              const tone = themeTone(theme.percent);
              return (
                <li key={theme.name} className="flex items-center gap-4">
                  <span className="w-28 shrink-0 text-sm text-foreground">
                    {theme.name}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E8EEF5]">
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{ width: `${Math.min(theme.percent, 100)}%` }}
                    />
                  </div>
                  <span
                    className={`w-12 shrink-0 text-right text-sm font-semibold ${tone.text}`}
                  >
                    {theme.percent}%
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </div>
  );
}
