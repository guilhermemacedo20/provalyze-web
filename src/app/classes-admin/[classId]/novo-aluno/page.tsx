"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { classesService, ClassDetail } from "@/services/classes.service";
import { User, usersService } from "@/services/users.service";

export default function AddStudentPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const [classInfo, setClassInfo] = useState<ClassDetail | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [existingIds, setExistingIds] = useState<string[]>([]); // já matriculados na turma
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // marcados nesta sessão
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([classesService.getClass(classId), usersService.listUsers()])
      .then(([classData, usersData]) => {
        setClassInfo(classData);
        setAllUsers(usersData);
        setExistingIds(classData.students.map((s) => s.id));
      })
      .catch((error) => {
        console.error("Erro ao buscar dados:", error);
        setAllUsers([]);
      })
      .finally(() => setLoading(false));
  }, [classId]);

  // Alunos que já foram marcados nesta sessão sempre visíveis em ordem alfabética.
  const selectedStudents = useMemo(() => {
    return selectedIds
      .map((id) => allUsers.find((u) => u.id === id))
      .filter((u): u is User => Boolean(u))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [allUsers, selectedIds]);

  // Alunos ainda disponíveis pra escolher respeitam a busca.
  const availableStudents = useMemo(() => {
    return allUsers.filter((user) => {
      if (user.role !== "STUDENT") return false;
      if (existingIds.includes(user.id)) return false;
      if (selectedIds.includes(user.id)) return false; // já aparece na lista de selecionados
      if (search.trim() === "") return true;
      return (
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [allUsers, search, existingIds, selectedIds]);

  // Enquanto tem busca digitada, mostra só o resultado dela. 
  const orderedStudents = useMemo(() => {
    if (search.trim() !== "") {
      return availableStudents;
    }
    return [...selectedStudents, ...availableStudents];
  }, [search, selectedStudents, availableStudents]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSearch("");
  };

  const handleConcluir = async () => {
    if (selectedIds.length === 0) {
      router.push(`/classes-admin/${classId}`);
      return;
    }

    setError(null);
    setSubmitting(true);

    const results = await Promise.allSettled(
      selectedIds.map((id) => classesService.addStudent(classId, id))
    );

    const failedIds = selectedIds.filter((_, index) => results[index].status === "rejected");

    if (failedIds.length === 0) {
      router.push(`/classes-admin/${classId}`);
      return;
    }

    setError(
      `${selectedIds.length - failedIds.length} aluno(s) adicionado(s) com sucesso. ${failedIds.length} falharam — tente novamente.`
    );
    setSelectedIds(failedIds);
    setSubmitting(false);
  };

  return (
    <div className="px-10 py-9">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="mb-2 text-xs text-muted">
            <Link href="/classes-admin" className="hover:underline">
              Turmas
            </Link>{" "}
            /{" "}
            <Link href={`/classes-admin/${classId}`} className="hover:underline">
              {classInfo?.name ?? "..."}
            </Link>{" "}
            / Adicionar Aluno
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {classInfo?.name ?? "Carregando..."}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleConcluir}
          disabled={submitting}
          className="rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {submitting
            ? "Adicionando..."
            : selectedIds.length > 0
              ? `Concluir (${selectedIds.length})`
              : "Concluir"}
        </button>
      </div>

      <div className="mb-5 rounded-lg border border-border bg-surface px-[22px] py-5 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="student-search" className="text-[13px] font-medium text-foreground">
            Buscar aluno
          </label>
          <input
            id="student-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digite um nome ou e-mail"
            className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted"
          />
        </div>
      </div>

      {error && <p className="mb-4 text-[13px] text-danger">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted">
              <th className="px-5 py-3" />
              <th className="px-5 py-3">ALUNO</th>
              <th className="px-5 py-3">E-MAIL</th>
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
            {!loading && orderedStudents.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-muted">
                  Nenhum aluno encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              orderedStudents.map((student) => {
                const isSelected = selectedIds.includes(student.id);
                return (
                  <tr
                    key={student.id}
                    className={`border-b border-border last:border-b-0 ${
                      isSelected ? "bg-primary-light" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(student.id)}
                        className="size-4 accent-primary"
                      />
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{student.name}</td>
                    <td className="px-5 py-3.5 text-muted">{student.email}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}