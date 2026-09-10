"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Course, coursesService } from "@/services/courses.service";
import { Subject, subjectsService } from "@/services/subjects.service";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function CourseSubjectsPage() {
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<Course | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourse = async () => {
    try {
      setCourse(await coursesService.getCourse(courseId));
    } catch (error) {
      console.error("Erro ao buscar curso:", error);
      setCourse(null);
    } finally {
      setCourseLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setSubjects(await subjectsService.listSubjects(courseId));
    } catch (error) {
      console.error("Erro ao buscar matérias:", error);
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
    fetchSubjects();
  }, [courseId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Informe o nome da matéria.");
      return;
    }

    setCreating(true);
    try {
      await subjectsService.createSubject(courseId, { name: name.trim() });
      setName("");
      await fetchSubjects();
    } catch (error) {
      console.error("Erro ao criar matéria:", error);
      setFormError("Não foi possível criar a matéria. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  const requestDelete = (subject: Subject) => setDeleteTarget(subject);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await subjectsService.deleteSubject(courseId, deleteTarget.id);
      setDeleteTarget(null);
      await fetchSubjects();
    } catch (error) {
      console.error("Erro ao excluir matéria:", error);
    } finally {
      setDeleting(false);
    }
  };

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!courseLoading && !course) {
    return (
      <div className="px-10 py-9">
        <p className="text-muted">Curso não encontrado.</p>
        <Link href="/courses" className="font-medium text-primary hover:underline">
          Voltar para Cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="relative px-10 py-9">
      <p className="mb-5 text-xs text-muted">
        <Link href="/courses" className="hover:underline">
          Cursos
        </Link>{" "}
        / {course?.name ?? "..."}
      </p>

      <h1 className="mb-5 text-2xl font-bold text-foreground">
        {course?.name ?? "Carregando..."}
      </h1>

      {/* Card de criação */}
      <form
        onSubmit={handleCreate}
        className="mb-5 flex flex-col gap-3.5 rounded-lg border border-[#d3e0fb] bg-[#f4f7fe] px-[22px] py-5"
      >
        <p className="text-sm font-semibold text-foreground">Criar nova matéria</p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="subject-name" className="text-[13px] font-medium text-foreground">
            Nome
          </label>
          <input
            id="subject-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Banco de Dados"
            className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted"
          />
        </div>

        {formError && <p className="text-[13px] text-danger">{formError}</p>}

        <button
          type="submit"
          disabled={creating}
          className="w-fit rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {creating ? "Criando..." : "Criar matéria"}
        </button>
      </form>

      {/* Busca */}
      <input
        type="text"
        placeholder="Pesquisar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-5 w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted"
      />

      {/* Lista */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted">
              <th className="px-5 py-3">MATÉRIA</th>
              <th className="px-5 py-3">DATA CRIAÇÃO</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {subjectsLoading && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-muted">
                  Carregando...
                </td>
              </tr>
            )}
            {!subjectsLoading && filteredSubjects.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-muted">
                  Nenhuma matéria encontrada.
                </td>
              </tr>
            )}
            {!subjectsLoading &&
              filteredSubjects.map((subject) => (
                <tr key={subject.id} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-3.5 font-semibold text-foreground">{subject.name}</td>
                  <td className="px-5 py-3.5 text-muted">{subject.createdAt}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => requestDelete(subject)}
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
        href="/courses"
        className="mt-6 inline-block text-sm font-medium text-muted hover:text-foreground"
      >
        ← Voltar
      </Link>
      
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir matéria"
        message={`Tem certeza que deseja excluir a matéria "${deleteTarget?.name}"?`}
        confirming={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}