"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/components/auth/AuthProvider";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { SchoolClass, classesService } from "@/services/classes.service";
import {
  StudentAnalytics,
  StudentThemeAnalysis,
  reportService,
} from "@/services/report.service";
import { formatAverage } from "@/utils/formatFunctions";
import { themeTone } from "@/utils/themeTone";

type Period = "year" | "all";

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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="flex min-w-[180px] flex-1 flex-col gap-2 rounded-[22px] border border-border bg-[#15803d] px-5 py-[18px] text-white shadow-sm">
      <p className="text-xs font-medium uppercase">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </article>
  );
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default function MyPerformancePage() {
  const { user } = useAuth();
  const userId = user?.id;

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState("");
  const [period, setPeriod] = useState<Period>("year");
  const [report, setReport] = useState<StudentAnalytics | null>(null);
  const [analysis, setAnalysis] = useState<StudentThemeAnalysis | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    classesService
      .listStudentClasses()
      .then((data) => {
        setClasses(data);
        setClassId(data[0]?.id ?? "");
      })
      .catch((cause) => setError(extractErrorMessage(cause)))
      .finally(() => setLoadingClasses(false));
  }, []);

  useEffect(() => {
    if (!classId || !userId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setReport(null);
    setAnalysis(null);
    setAnalysisMessage("");

    reportService
      .getStudentAnalytics(classId, userId)
      .then((data) => {
        if (cancelled) return;
        setReport(data);

        if (data.themes.length === 0) {
          setAnalysisMessage("Ainda não há desempenho por tema para analisar.");
          return;
        }

        setAnalysisMessage("Analisando seu desempenho...");
        reportService
          .getStudentThemeAnalysis(classId, userId)
          .then((result) => {
            if (!cancelled) setAnalysis(result);
          })
          .catch((cause) => {
            if (!cancelled) setAnalysisMessage(extractErrorMessage(cause));
          });
      })
      .catch((cause) => {
        if (!cancelled) setError(extractErrorMessage(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [classId, userId]);

  const exams = useMemo(() => {
    if (!report) return [];
    const currentYear = new Date().getFullYear();
    return report.exams
      .filter(
        (exam) =>
          exam.finishedAt &&
          (period === "all" ||
            new Date(exam.finishedAt).getFullYear() === currentYear),
      )
      .sort(
        (a, b) =>
          new Date(a.finishedAt as string).getTime() -
          new Date(b.finishedAt as string).getTime(),
      );
  }, [report, period]);

  const scoredExams = exams.filter((exam) => exam.score != null);

  const average = scoredExams.length
    ? Math.round(
        (scoredExams.reduce((sum, exam) => sum + (exam.score ?? 0), 0) /
          scoredExams.length) *
          100,
      ) / 100
    : null;

  const chartData = scoredExams.map((exam) => ({
    name: exam.title,
    score: exam.score as number,
    date: formatDate(exam.finishedAt as string),
  }));

  if (!loadingClasses && classes.length === 0) {
    return (
      <div className="px-10 py-9">
        <h1 className="mb-4 text-[26px] font-bold text-foreground">
          Meu desempenho
        </h1>
        <p className="text-sm text-muted">
          {error ?? "Você ainda não está em nenhuma matéria."}
        </p>
        <Link
          href="/my-classes"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Ir para Matérias
        </Link>
      </div>
    );
  }

  return (
    <div className="px-10 py-9">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[26px] font-bold text-foreground">
          Meu desempenho
        </h1>
        <div className="flex flex-wrap gap-3">
          <FilterSelect label="Matéria" value={classId} onChange={setClassId}>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.subjectName}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Período"
            value={period}
            onChange={(value) => setPeriod(value as Period)}
          >
            <option value="year">No ano</option>
            <option value="all">Todas as provas</option>
          </FilterSelect>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="mb-2 flex flex-wrap gap-4">
        <StatCard
          label="Média"
          value={formatAverage(average, loading || loadingClasses)}
        />
        <StatCard
          label="Total de provas"
          value={report ? String(exams.length) : "-"}
        />
        <StatCard
          label="Dissertativas (acertos/erros)"
          value={
            report
              ? `${report.answers.essay.correct}/${report.answers.essay.wrong}`
              : "-"
          }
        />
        <StatCard
          label="Alternativas (acertos/erros)"
          value={
            report
              ? `${report.answers.objective.correct}/${report.answers.objective.wrong}`
              : "-"
          }
        />
      </div>
      <p className="mb-6 text-xs text-muted">
        Acertos, erros e desempenho por tema consideram todo o período.
      </p>

      <article className="mb-6 rounded-[22px] border border-border bg-surface px-6 py-[22px] shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Seu desempenho por tema
        </h2>
        {loading ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : !report || report.themes.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma resposta corrigida ainda.</p>
        ) : (
          <ul className="space-y-4">
            {report.themes.map((theme) => {
              const tone = themeTone(theme.percent);
              return (
                <li key={theme.name}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-foreground">
                      {theme.name}
                    </span>
                    <span className={`font-semibold ${tone.text}`}>
                      {theme.percent}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{ width: `${Math.min(theme.percent, 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </article>

      <article className="mb-6 rounded-[22px] border border-[#fce7c2] bg-[#fef7eb] px-6 py-[22px] text-[#92400e]">
        <h2 className="mb-3 text-[15px] font-semibold">Pontos para melhorar</h2>
        {analysis ? (
          <div className="space-y-2 text-[13px] leading-relaxed">
            <p>{analysis.difficulty}</p>
            <p>{analysis.recommendation}</p>
          </div>
        ) : (
          <p className="text-[13px]">
            {loading ? "Carregando..." : analysisMessage}
          </p>
        )}
      </article>

      <article className="mb-6 rounded-[22px] border border-border bg-surface px-6 py-[22px] shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Evolução das notas
        </h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted">
            Nenhuma prova com nota {period === "year" ? "neste ano" : "ainda"}.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                interval={0}
                tickFormatter={(title: string) =>
                  title.length > 14 ? `${title.slice(0, 13)}…` : title
                }
              />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip
                formatter={(value) => [
                  Number(value).toLocaleString("pt-BR"),
                  "Nota",
                ]}
                labelFormatter={(_, payload) =>
                  payload?.[0]
                    ? `${payload[0].payload.name} · ${payload[0].payload.date}`
                    : ""
                }
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 4, fill: "#16a34a" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </article>

      <article className="rounded-[22px] border border-border bg-surface px-6 py-[22px]">
        <h2 className="mb-2 text-base font-semibold text-foreground">
          Histórico de provas
        </h2>
        {exams.length === 0 ? (
          <p className="py-4 text-sm text-muted">Nenhuma prova realizada.</p>
        ) : (
          <ul>
            {[...exams].reverse().map((exam) => (
              <li
                key={`${exam.title}-${exam.finishedAt}`}
                className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm last:border-b-0"
              >
                <p className="text-foreground">
                  <span className="font-medium">{exam.title}</span>
                  <span className="ml-3 text-muted">
                    {formatDate(exam.finishedAt as string)}
                  </span>
                </p>
                <p className="shrink-0 font-semibold text-foreground">
                  {formatAverage(exam.score, false)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}