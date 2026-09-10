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
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([classesService.getClass(classId), usersService.listUsers()])
      .then(([classData, usersData]) => {
        setClassInfo(classData);
        setAllUsers(usersData);
        // pré-preenche addedIds com quem JÁ está matriculado na turma,
        // pra essa lista não aparecer de novo como "disponível pra adicionar".
        setAddedIds(classData.students.map((student) => student.id));
      })
      .catch((error) => {
        console.error("Erro ao buscar dados:", error);
        setAllUsers([]);
      })
      .finally(() => setLoading(false));
  }, [classId]);

  const students = useMemo(() => {
    return allUsers.filter((user) => {
      if (user.role !== "STUDENT") return false;
      if (addedIds.includes(user.id)) return false;
      if (search.trim() === "") return true;
      return (
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [allUsers, search, addedIds]);

  const handleAdd = async (studentId: string) => {
    setError(null);
    setAddingId(studentId);
    try {
      await classesService.addStudent(classId, studentId);
      setAddedIds((prev) => [...prev, studentId]);
    } catch (err) {
      console.error("Erro ao adicionar aluno:", err);
      setError("Não foi possível adicionar esse aluno. Tente novamente.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="px-10 py-9">
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
      <h1 className="mb-5 text-2xl font-bold text-foreground">
        {classInfo?.name ?? "Carregando..."}
      </h1>

      <div className="mb-5 rounded-lg border border-border bg-surface px-[22px] py-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-1.5">
          <label htmlFor="student-search" className="text-[13px] font-medium text-foreground">
            Buscar aluno ou importar lista
          </label>
          <input
            id="student-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digite um nome, e-mail, ou clique em importar CSV"
            className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted"
          />
        </div>

        <button
          type="button"
          disabled
          title="Importação de CSV ainda não implementada"
          className="rounded-md border border-border px-4 py-2 text-[13px] font-semibold text-muted opacity-60"
        >
          Importar lista (CSV)
        </button>
      </div>

      {error && <p className="mb-4 text-[13px] text-danger">{error}</p>}

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
            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-muted">
                  Nenhum aluno encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              students.map((student) => (
                <tr key={student.id} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-3.5 font-medium text-foreground">{student.name}</td>
                  <td className="px-5 py-3.5 text-muted">{student.email}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleAdd(student.id)}
                      disabled={addingId === student.id}
                      className="font-medium text-primary hover:underline disabled:opacity-60"
                    >
                      {addingId === student.id ? "Adicionando..." : "Adicionar"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => router.push(`/classes-admin/${classId}`)}
        className="mt-6 rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover"
      >
        Concluir
      </button>
    </div>
  );
}