"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ClassDetail, classesService } from "@/services/classes.service";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { extractErrorMessage } from "@/lib/extract-error-message";

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const [schoolClass, setSchoolClass] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // controla o modal de confirmação de excluir a turma inteira.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // controla o modal de confirmação de remover um aluno específico da turma.
  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const [confirmingResetCode, setConfirmingResetCode] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const fetchClass = useCallback(async () => {
    try {
      setSchoolClass(await classesService.getClass(classId));
    } catch (error) {
      console.error("Erro ao buscar turma:", error);
      setSchoolClass(null);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClass();
  }, [fetchClass]);

  const confirmDeleteClass = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await classesService.deleteClass(classId);
      router.push("/classes");
    } catch (error) {
      console.error("Erro ao excluir turma:", error);
      setDeleteError(extractErrorMessage(error));
      setDeleting(false);
    }
  };

  const confirmRemoveStudent = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      await classesService.removeStudent(classId, removeTarget.id);
      setRemoveTarget(null);
      await fetchClass();
    } catch (error) {
      console.error("Erro ao remover aluno:", error);
      setRemoveError(extractErrorMessage(error));
    } finally {
      setRemoving(false);
    }
  };

  const confirmResetCode = async () => {
    setResetting(true);
    setResetError(null);
    try {
      const { joinCode } = await classesService.resetJoinCode(classId);
      setSchoolClass((current) =>
        current ? { ...current, joinCode } : current,
      );
      setConfirmingResetCode(false);
    } catch (error) {
      console.error("Erro ao gerar novo código:", error);
      setResetError(extractErrorMessage(error));
    } finally {
      setResetting(false);
    }
  };

  if (!loading && !schoolClass) {
    return (
      <div className="px-10 py-9">
        <p className="text-muted">Turma não encontrada.</p>
        <Link
          href="/classes"
          className="font-medium text-primary hover:underline"
        >
          Voltar para Turmas
        </Link>
      </div>
    );
  }

  return (
    <div className="relative px-10 py-9">
      <p className="mb-2 text-xs text-muted">
        <Link href="/classes" className="hover:underline">
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
            href={`/classes/${classId}/novo-aluno`}
            className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            + Adicionar aluno
          </Link>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setConfirmingDelete(true);
            }}
            className="rounded-md border border-danger px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10"
          >
            Excluir turma
          </button>
        </div>
      </div>

      {schoolClass && (
        <p className="mb-6 text-sm text-muted">
          {schoolClass.subjectName} · {schoolClass.students.length} alunos ·{" "}
          {schoolClass.courseName} · Professor(a) {schoolClass.teacherName} ·
          Código: <span className="font-mono">{schoolClass.joinCode}</span>
          <button
            type="button"
            onClick={() => {
              setResetError(null);
              setConfirmingResetCode(true);
            }}
            className="ml-2 inline-flex cursor-pointer items-center rounded-md border border-border px-2 py-0.5 align-middle text-xs font-medium text-primary transition-colors hover:border-primary hover:bg-primary-light"
          >
            Gerar novo código
          </button>
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
                <tr
                  key={student.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    <Link
                      href={`/classes/${classId}/students/${student.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {student.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{student.email}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveError(null);
                        setRemoveTarget({ id: student.id, name: student.name });
                      }}
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
        href="/classes"
        className="mt-6 inline-block text-sm font-medium text-muted hover:text-foreground"
      >
        ← Voltar
      </Link>

      <ConfirmDialog
        open={confirmingDelete}
        title="Excluir turma"
        message={`Tem certeza que deseja excluir a turma "${schoolClass?.name}"?`}
        error={deleteError}
        confirming={deleting}
        onConfirm={confirmDeleteClass}
        onCancel={() => setConfirmingDelete(false)}
      />

      <ConfirmDialog
        open={confirmingResetCode}
        title="Gerar novo código"
        message="O código atual deixará de funcionar e os alunos que ainda não entraram precisarão do novo código. Os alunos já matriculados continuam na turma."
        error={resetError}
        confirmLabel="Gerar código"
        confirming={resetting}
        onConfirm={confirmResetCode}
        onCancel={() => setConfirmingResetCode(false)}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        title="Remover aluno da turma"
        message={`Tem certeza que deseja remover "${removeTarget?.name}" desta turma?`}
        error={removeError}
        confirming={removing}
        onConfirm={confirmRemoveStudent}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
