"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { classesService, SchoolClass } from "@/services/classes.service";
import { ReportAnalysisType, reportService } from "@/services/report.service";

const analysisOptions: { value: ReportAnalysisType; label: string }[] = [
  { value: "BOTH", label: "Desempenho + Lacunas" },
  { value: "PERFORMANCE", label: "Desempenho" },
  { value: "GAPS", label: "Lacunas" },
];

const includedByType: Record<ReportAnalysisType, string[]> = {
  PERFORMANCE: ["Resumo geral do desempenho", "Distribuição de notas por tema"],
  GAPS: [
    "Dificuldades identificadas por tema",
    "Insights e recomendações pedagógicas geradas por IA",
  ],
  BOTH: [
    "Resumo geral do desempenho",
    "Distribuição de notas por tema",
    "Dificuldades identificadas por tema",
    "Insights e recomendações pedagógicas geradas por IA",
  ],
};

export default function NewReportPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState("");
  const [analysisType, setAnalysisType] = useState<ReportAnalysisType>("BOTH");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    classesService
      .listClasses()
      .then((data) => {
        setClasses(data);
        if (data[0]) {
          setClassId(data[0].id);
        }
      })
      .catch(() => setClasses([]));
  }, []);

  const generateReport = async () => {
    setSaving(true);
    setError(null);

    try {
      const report = await reportService.createPedagogicalReport({
        classId,
        analysisType,
      });
      const { downloadPedagogicalReportPdf } = await import(
        "@/utils/pedagogical-report-pdf"
      );
      await downloadPedagogicalReportPdf(report);
      router.push("/reports");
    } catch (error) {
      setError(extractErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <div className="px-10 py-9">
      <p className="mb-2 text-xs text-muted">
        <Link href="/reports" className="hover:underline">
          Relatórios
        </Link>
        {" / Gerar relatório"}
      </p>
      <h1 className="text-2xl font-bold text-foreground">
        Gerar Relatório Pedagógico
      </h1>
      <p className="mt-1 mb-6 max-w-2xl text-sm text-muted">
        Selecione os filtros para gerar uma análise completa do desempenho.
      </p>

      <div className="max-w-3xl rounded-2xl border border-border bg-surface p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-foreground">Turma</span>
            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2.5"
            >
              {classes.length === 0 && <option value="">Nenhuma turma</option>}
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name} - {schoolClass.subjectName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-foreground">Tipo de análise</span>
            <select
              value={analysisType}
              onChange={(event) =>
                setAnalysisType(event.target.value as ReportAnalysisType)
              }
              className="rounded-md border border-border bg-surface px-3 py-2.5"
            >
              {analysisOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-xl bg-background p-4">
          <p className="text-sm font-semibold text-foreground">
            O relatório vai incluir
          </p>
          <ul className="mt-3 space-y-2 text-sm text-foreground">
            {includedByType[analysisType].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <Link
            href="/reports"
            className="rounded-md px-4 py-2.5 text-sm font-semibold text-muted hover:text-foreground"
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={() => generateReport()}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Gerando..." : "Gerar relatório"}
          </button>
        </div>
      </div>
    </div>
  );
}
