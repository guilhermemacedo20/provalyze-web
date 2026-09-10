"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { subjectsService, SubjectOption } from "@/services/subjects.service";
import { usersService, User } from "@/services/users.service";
import { classesService } from "@/services/classes.service";

export default function NewClassPage() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([subjectsService.listAllSubjects(), usersService.listUsers()])
      .then(([subjectsData, usersData]) => {
        setSubjects(subjectsData);
        setTeachers(usersData.filter((user) => user.role === "TEACHER"));
      })
      .catch((error) => {
        console.error("Erro ao buscar matérias/professores:", error);
        setSubjects([]);
        setTeachers([]);
      })
      .finally(() => setOptionsLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !subjectId || !teacherId) {
      setFormError("Preencha todos os campos.");
      return;
    }

    setCreating(true);
    try {
      await classesService.createClass({
        name: name.trim(),
        subjectId,
        teacherId,
      });
      router.push("/classes-admin");
    } catch (error) {
      console.error("Erro ao criar turma:", error);
      setFormError("Não foi possível criar a turma. Tente novamente.");
      setCreating(false);
    }
  };

  return (
    <div className="px-10 py-9">
      <p className="mb-2 text-xs text-muted">
        <Link href="/classes-admin" className="hover:underline">
          Turmas
        </Link>{" "}
        / Nova turma
      </p>
      <h1 className="mb-5 text-2xl font-bold text-foreground">Nova Turma</h1>

      <form
        onSubmit={handleCreate}
        className="mb-5 flex flex-col gap-5 rounded-lg border border-border bg-surface px-[22px] py-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="class-name" className="text-[13px] font-medium text-foreground">
            Nome da turma
          </label>
          <input
            id="class-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: 1º A"
            className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted"
          />
        </div>

        <div className="flex gap-5">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="class-subject" className="text-[13px] font-medium text-foreground">
              Matéria
            </label>
            <select
              id="class-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={optionsLoading}
              className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground disabled:opacity-60"
            >
              <option value="">Selecione uma matéria</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} - {subject.courseName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="class-teacher" className="text-[13px] font-medium text-foreground">
              Professor(a) responsável
            </label>
            <select
              id="class-teacher"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              disabled={optionsLoading}
              className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground disabled:opacity-60"
            >
              <option value="">Selecione um(a) professor(a)</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formError && <p className="text-[13px] text-danger">{formError}</p>}

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/classes-admin"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {creating ? "Criando..." : "Criar turma"}
          </button>
        </div>
      </form>
    </div>
  );
}