"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SchoolClass, classesService } from "@/services/classes.service";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

function formatAverage(value: number | null) {
  if (value === null) return "—";
  return value.toFixed(1).replace(".", ",");
}

export default function ClassesAdminPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClasses = async () => {
    try {
      const data = await classesService.listClasses();
      setClasses(data);
    } catch (error) {
      console.error("Erro ao buscar turmas:", error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const requestDelete = (schoolClass: SchoolClass) => setDeleteTarget(schoolClass);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await classesService.deleteClass(deleteTarget.id);
      setDeleteTarget(null);
      await fetchClasses();
    } catch (error) {
      console.error("Erro ao excluir turma:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative px-10 py-9">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turmas</h1>
          <p className="mt-1 text-sm text-muted">
            Todas as turmas da instituição, de todos os professores
          </p>
        </div>
        <Link
          href="/classes-admin/new"
          className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          + Nova turma
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted">
              <th className="px-5 py-3">TURMA</th>
              <th className="px-5 py-3">CÓDIGO</th>
              <th className="px-5 py-3">PROFESSOR(A)</th>
              <th className="px-5 py-3">MATÉRIA</th>
              <th className="px-5 py-3">ALUNOS</th>
              <th className="px-5 py-3">MÉDIA</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-muted">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && classes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-muted">
                  Nenhuma turma encontrada.
                </td>
              </tr>
            )}
            {!loading &&
              classes.map((schoolClass) => (
                <tr key={schoolClass.id} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-3.5 font-semibold text-foreground">
                    {schoolClass.name}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-muted">{schoolClass.joinCode}</td>
                  <td className="px-5 py-3.5 text-muted">{schoolClass.teacherName}</td>
                  <td className="px-5 py-3.5 text-muted">
                    {schoolClass.subjectName} - {schoolClass.courseName}
                  </td>
                  <td className="px-5 py-3.5 text-muted">{schoolClass.studentsCount}</td>
                  <td className="px-5 py-3.5 text-muted">
                    {formatAverage(schoolClass.averageScore)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/classes-admin/${schoolClass.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        Ver detalhes
                      </Link>
                      <button
                        type="button"
                        onClick={() => requestDelete(schoolClass)}
                        className="text-muted hover:text-danger"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir turma"
        message={`Tem certeza que deseja excluir a turma "${deleteTarget?.name}"?`}
        confirming={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}