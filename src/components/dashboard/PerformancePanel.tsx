"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "@/components/ui/MetricCard";
import { extractErrorMessage } from "@/lib/extract-error-message";
import {
  reportService,
  type DashboardFilter,
  type DashboardPeriod,
  type DashboardStats,
} from "@/services/report.service";
import { formatAverage, formatCount } from "@/utils/formatFunctions";

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
  { value: "all", label: "Total" },
];

const OUTCOMES = [
  { key: "correct", label: "Certas", color: "#16a34a" },
  { key: "wrong", label: "Erradas", color: "#dc2626" },
  { key: "pending", label: "Aguardando correção", color: "#94a3b8" },
] as const;

type CardValues = {
  totalExams?: number;
  totalAverage?: number | null;
  hitRate?: number | null;
  upcomingExams?: number;
  finishedExams?: number;
};

const field =
  "rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] text-foreground disabled:opacity-60";
const grid = "#e2e8f0";
const tick = { fontSize: 12, fill: "#64748b" };

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};
const score = (value: number) => formatAverage(value, false);

function ChartCard({
  title,
  action,
  wide,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`min-w-0 rounded-[22px] border border-border bg-surface px-6 py-5 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)] ${wide ? "xl:col-span-2" : ""}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PerformancePanel({
  audience,
  aside,
}: {
  audience: "teacher" | "admin" | "student";
  aside?: React.ReactNode;
}) {
  const student = audience === "student";
  const tone = student ? "green" : "blue";
  const color = student ? "#16a34a" : "#2563eb";

  const [filter, setFilter] = useState<DashboardFilter>(() => ({
    period: "month",
    month: currentMonth(),
    year: String(new Date().getFullYear()),
  }));
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examId, setExamId] = useState("");
  const [question, setQuestion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    reportService
      .getDashboard(filter)
      .then((result) => {
        if (!active) return;
        setData(result);
        setExamId("");
        setQuestion(0);
      })
      .catch((err) => active && setError(extractErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [filter]);

  const years = Array.from({ length: 5 }, (_, i) =>
    String(new Date().getFullYear() - i),
  );
  const subjects = [
    ...new Map((data?.classes ?? []).map((c) => [c.subjectId, c.subjectName])),
  ];
  const hasData = !!data && data.questionsByExam.length > 0;
  const emptyText = "Nenhuma prova entregue nesse período";
  const empty = (text = emptyText) => (
    <p className="flex h-[240px] items-center justify-center rounded-[14px] border border-dashed border-border text-[13px] text-muted">
      {text}
    </p>
  );

  const exam = data?.questionsByExam.find((e) => e.examId === examId);
  const outcomes =
    (question
      ? exam?.questions.find((q) => q.number === question)
      : exam?.answers) ?? data?.answers;
  const pieData = OUTCOMES.map((o) => ({
    name: o.label,
    fill: o.color,
    value: outcomes?.[o.key] ?? 0,
  })).filter((d) => d.value > 0);
  const v = (data ?? {}) as CardValues;
  const hitRate = loading
    ? "Carregando..."
    : v.hitRate == null
      ? "-"
      : `${v.hitRate}%`;
  const cards =
    audience === "teacher"
      ? [
          {
            label: "Provas aplicadas",
            value: formatCount(v.totalExams, loading),
          },
          {
            label: "Média geral",
            value: formatAverage(v.totalAverage, loading),
          },
          { label: "Taxa de acertos", value: hitRate },
        ]
      : audience === "student"
        ? [
            {
              label: "Próximas provas",
              value: formatCount(v.upcomingExams, loading),
            },
            {
              label: "Provas concluídas",
              value: formatCount(v.finishedExams, loading),
            },
            {
              label: "Média geral",
              value: formatAverage(v.totalAverage, loading),
            },
            { label: "Taxa de acertos", value: hitRate },
          ]
        : [];

  return (
    <section className="flex flex-col gap-4" aria-busy={loading}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-foreground">
            {student ? "Meu desempenho" : "Desempenho das turmas"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[176px] shrink-0">
            {filter.period === "month" && (
              <input
                type="month"
                aria-label="Mês"
                value={filter.month}
                max={currentMonth()}
                disabled={loading}
                onChange={(e) =>
                  e.target.value &&
                  setFilter({ ...filter, month: e.target.value })
                }
                className={`${field} w-full`}
              />
            )}
            {filter.period === "year" && (
              <select
                aria-label="Ano"
                value={filter.year}
                disabled={loading}
                onChange={(e) => setFilter({ ...filter, year: e.target.value })}
                className={`${field} w-full`}
              >
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            )}
            {filter.period === "all" && (
              <select
                aria-label="Período selecionado"
                disabled
                className={`${field} w-full`}
              >
                <option>Todo o período</option>
              </select>
            )}
          </div>

          <div
            role="radiogroup"
            aria-label="Período"
            className="flex rounded-[10px] border border-border bg-surface p-0.5"
          >
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={filter.period === p.value}
                disabled={loading}
                onClick={() => setFilter({ ...filter, period: p.value })}
                className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium ${
                  filter.period === p.value
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {student ? (
            <select
              aria-label="Matéria"
              value={filter.subjectId ?? ""}
              disabled={loading}
              onChange={(e) =>
                setFilter({ ...filter, subjectId: e.target.value || undefined })
              }
              className={`${field} max-w-[260px]`}
            >
              <option value="">Todas as matérias</option>
              {subjects.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <select
              aria-label="Turma"
              value={filter.classId ?? ""}
              disabled={loading}
              onChange={(e) =>
                setFilter({ ...filter, classId: e.target.value || undefined })
              }
              className={`${field} max-w-[260px]`}
            >
              <option value="">Todas as turmas</option>
              {data?.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.subjectName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-[14px] bg-danger/10 px-4 py-3 text-[13px] text-danger">
          Não foi possível carregar o desempenho: {error}
        </p>
      )}

      {cards.length > 0 && (
        <div
          className={`grid grid-cols-1 gap-4 ${cards.length === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "lg:grid-cols-3"}`}
        >
          {cards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              tone={tone}
            />
          ))}
        </div>
      )}

      <div
        className={`grid grid-cols-1 gap-4 ${aside ? "xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : "xl:grid-cols-2"}`}
      >
        {aside && (
          <div className="relative xl:row-span-2">
            <div className="flex flex-col gap-4 xl:absolute xl:inset-0">
              {aside}
            </div>
          </div>
        )}

        <ChartCard
          title={
            student ? "Minhas notas por prova" : "Média das notas por prova"
          }
        >
          {hasData && data.scoresByExam.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={data.scoresByExam}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke={grid} />
                <XAxis
                  dataKey="title"
                  tick={tick}
                  interval={0}
                  tickFormatter={(t: string) =>
                    t.length > 14 ? `${t.slice(0, 13)}…` : t
                  }
                />
                <YAxis domain={[0, "auto"]} tick={tick} />
                <Tooltip
                  formatter={(v) => [
                    score(Number(v)),
                    student ? "Nota" : "Média",
                  ]}
                />
                <Bar
                  dataKey="average"
                  fill={color}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            empty(
              hasData
                ? "As provas do período ainda aguardam correção."
                : emptyText,
            )
          )}
        </ChartCard>

        <ChartCard
          title={student ? "Minhas respostas" : "Respostas por questão"}
          action={
            hasData && (
              <div className="flex flex-wrap gap-2">
                <select
                  aria-label="Prova"
                  value={examId}
                  onChange={(e) => {
                    setExamId(e.target.value);
                    setQuestion(0);
                  }}
                  className={`${field} max-w-[200px] py-1.5`}
                >
                  <option value="">Todas as provas</option>
                  {[...data.questionsByExam].reverse().map((e) => (
                    <option key={e.examId} value={e.examId}>
                      {e.title}
                    </option>
                  ))}
                </select>
                {!student && exam && (
                  <select
                    aria-label="Questão"
                    value={question}
                    onChange={(e) => setQuestion(Number(e.target.value))}
                    className={`${field} max-w-[200px] py-1.5`}
                  >
                    <option value={0}>Todas as questões</option>
                    {exam.questions.map((q) => (
                      <option key={q.number} value={q.number}>
                        Questão {q.number} · {q.theme}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )
          }
        >
          {hasData && pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={2}
                />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            empty()
          )}
        </ChartCard>
      </div>

      {!!data?.pendingSubmissions && (
        <p className="text-[12px] text-muted">
          {data.pendingSubmissions} entrega(s) aguardam correção de questões
          dissertativas e ainda não entram nas médias nem no gráfico de notas.
        </p>
      )}
    </section>
  );
}
