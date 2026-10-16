"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { classesService, SchoolClass } from "@/services/classes.service";
import {
  PedagogicalReportSummary,
  reportService,
} from "@/services/report.service";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
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

export default function ReportsPage() {
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [reports, setReports] = useState<PedagogicalReportSummary[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<PedagogicalReportSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const deleteReport = async (id: string) => {
    await reportService.deletePedagogicalReport(id);
    await reportService.listPedagogicalReports(classId).then((data) => {
      setReports(data);
    });
  };

  useEffect(() => {
    classesService
      .listClasses()
      .then(setClasses)
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reportService
      .listPedagogicalReports(classId)
      .then((data) => {
        if (cancelled) return;
        setReports(data);
        setError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setError(extractErrorMessage(error));
        setReports([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const requestDelete = (reportId: PedagogicalReportSummary) =>
    setDeleteTarget(reportId);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      deleteReport(deleteTarget.id);
    } catch (error) {
      console.error("Erro ao excluir o relatório:", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="px-10 py-9">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Relatórios Pedagógicos
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect label="Turma" value={classId} onChange={setClassId}>
            <option value="">Turma: Todas</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                Turma: {schoolClass.name} · {schoolClass.subjectName}
              </option>
            ))}
          </FilterSelect>
          <Link
            href="/reports/new"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Gerar relatório
          </Link>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted">
              <th className="px-5 py-3">RELATÓRIO</th>
              <th className="px-5 py-3">TURMA</th>
              <th className="px-5 py-3">DATA</th>
              <th className="px-5 py-3">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-muted">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && reports?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-muted">
                  Nenhum relatório encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              reports?.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {report.title}
                  </td>
                  <td className="px-5 py-3.5 text-muted">{report.className}</td>
                  <td className="px-5 py-3.5 text-muted">
                    {formatDate(report.createdAt)}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => requestDelete(report)}
                      className="text-muted hover:text-danger mr-4"
                    >
                      Excluir
                    </button>
                    <button
                      type="button"
                      disabled={exportingId === report.id}
                      onClick={() => {
                        setExportingId(report.id);
                        setError(null);
                        reportService
                          .downloadPedagogicalReport(report.id)
                          .catch((cause) =>
                            setError(extractErrorMessage(cause)),
                          )
                          .finally(() => setExportingId(null));
                      }}
                      className="text-muted disabled:opacity-60"
                    >
                      {exportingId === report.id ? "Exportando..." : "Exportar"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir relatório"
        message={`Tem certeza que deseja excluir o relatorio "${deleteTarget?.title}"?`}
        confirming={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
