"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ClassDetail, classesService } from "@/services/classes.service";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const [schoolClass, setSchoolClass] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // controla o modal de confirmação de excluir a turma inteira.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // controla o modal de confirmação de remover um aluno específico da turma.
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchClass = async () => {
    try {
      setSchoolClass(await classesService.getClass(classId));
    } catch (error) {
      console.error("Erro ao buscar turma:", error);
      setSchoolClass(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClass();
  }, [classId]);

  const confirmDeleteClass = async () => {
    setDeleting(true);
    try {
      await classesService.deleteClass(classId);
      router.push("/classes-admin");
    } catch (error) {
      console.error("Erro ao excluir turma:", error);
      setDeleting(false);
    }
  };

  const confirmRemoveStudent = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await classesService.removeStudent(classId, removeTarget.id);
      setRemoveTarget(null);
      await fetchClass();
    } catch (error) {
      console.error("Erro ao remover aluno:", error);
    } finally {
      setRemoving(false);
    }
  };

  if (!loading && !schoolClass) {
    return (
      <div className="px-10 py-9">
        <p className="text-muted">Turma não encontrada.</p>
        <Link href="/classes-admin" className="font-medium text-primary hover:underline">
          Voltar para Turmas
        </Link>
      </div>
    );
  }

  return (
    <div className="relative px-10 py-9">
      <p className="mb-2 text-xs text-muted">
        <Link href="/classes-admin" className="hover:underline">
          Turmas
        </Link>{" "}
        / {schoolClass?.name ?? "..."}
      </p>

      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {schoolClass?.name ?? "Carregando..."}
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href={`/classes-admin/${classId}/novo-aluno`}
            className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            + Adicionar aluno
          </Link>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="rounded-md border border-danger px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10"
          >
            Excluir turma
          </button>
        </div>
      </div>

      {schoolClass && (
        <p className="mb-6 text-sm text-muted">
          {schoolClass.subjectName} · {schoolClass.students.length} alunos ·{" "}
          {schoolClass.courseName} · Professor(a) {schoolClass.teacherName} · Código:{" "}
          <span className="font-mono">{schoolClass.joinCode}</span>
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted">
              <th className="px-5 py-3">ALUNO</th>
              <th className="px-5 py-3">E-MAIL</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-muted">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && schoolClass && schoolClass.students.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-muted">
                  Nenhum aluno matriculado ainda.
                </td>
              </tr>
            )}
            {!loading &&
              schoolClass?.students.map((student) => (
                <tr key={student.id} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-3.5 font-medium text-foreground">{student.name}</td>
                  <td className="px-5 py-3.5 text-muted">{student.email}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setRemoveTarget({ id: student.id, name: student.name })}
                      className="text-muted hover:text-danger"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Link
        href="/classes-admin"
        className="mt-6 inline-block text-sm font-medium text-muted hover:text-foreground"
      >
        ← Voltar
      </Link>

      <ConfirmDialog
        open={confirmingDelete}
        title="Excluir turma"
        message={`Tem certeza que deseja excluir a turma "${schoolClass?.name}"?`}
        confirming={deleting}
        onConfirm={confirmDeleteClass}
        onCancel={() => setConfirmingDelete(false)}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        title="Remover aluno da turma"
        message={`Tem certeza que deseja remover "${removeTarget?.name}" desta turma?`}
        confirming={removing}
        onConfirm={confirmRemoveStudent}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}