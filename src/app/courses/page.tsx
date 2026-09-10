"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Course, coursesService } from "@/services/courses.service";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function CoursesPage() {
  // listagem de cursos.
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // referente ao estado do formulário de criar um novo curso.
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // referente ao modal de confirmação de exclusão.
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  // busca toda a lista de cursos novamente.
  const fetchCourses = async () => {
    try {
      const data = await coursesService.listCourses();
      setCourses(data);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // busca os cursos, roda apenas quando a tela monta pela primeira vez.
  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Informe o nome do curso.");
      return;
    }

    setCreating(true);
    try {
      await coursesService.createCourse({ name: name.trim() });
      setName("");
      await fetchCourses();
    } catch (error) {
      console.error("Erro ao criar curso:", error);
      setFormError("Não foi possível criar o curso. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  // abre o modal de confirmação, guardando qual curso será excluído.
  const requestDelete = (course: Course) => setDeleteTarget(course);

  // executa a exclusão de verdade, chamada pelo botão de confirmar do modal.
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await coursesService.deleteCourse(deleteTarget.id);
      setDeleteTarget(null);
      await fetchCourses();
    } catch (error) {
      console.error("Erro ao excluir curso:", error);
    } finally {
      setDeleting(false);
    }
  };

  // filtra e lista os cursos contendo só os que contém o texto da busca.
  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    // "relative" é necessário pro modal (fixed inset-0) se posicionar corretamente.
    <div className="relative px-10 py-9">
      <h1 className="mb-5 text-2xl font-bold text-foreground">Cursos</h1>

      {/* Card de criação */}
      <form
        onSubmit={handleCreate}
        className="mb-5 flex flex-col gap-3.5 rounded-lg border border-[#d3e0fb] bg-[#f4f7fe] px-[22px] py-5"
      >
        <p className="text-sm font-semibold text-foreground">Criar novo curso</p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="course-name" className="text-[13px] font-medium text-foreground">
            Nome
          </label>
          <input
            id="course-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Engenharia de software"
            className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted"
          />
        </div>

        {formError && <p className="text-[13px] text-danger">{formError}</p>}

        <button
          type="submit"
          disabled={creating}
          className="w-fit rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {creating ? "Criando..." : "Criar curso"}
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
              <th className="px-5 py-3">CURSO</th>
              <th className="px-5 py-3">DATA CRIAÇÃO</th>
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
            {!loading && filteredCourses.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-muted">
                  Nenhum curso encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              filteredCourses.map((course) => (
                <tr key={course.id} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-3.5 font-semibold text-foreground">{course.name}</td>
                  <td className="px-5 py-3.5 text-muted">{course.createdAt}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/courses/${course.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        Ver detalhes
                      </Link>
                      <button
                        type="button"
                        onClick={() => requestDelete(course)}
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
        title="Excluir curso"
        message={`Tem certeza que deseja excluir o curso "${deleteTarget?.name}"? Essa ação também remove todas as matérias e turmas vinculadas a ele.`}
        confirming={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}