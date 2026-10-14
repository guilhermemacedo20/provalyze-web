"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  StudentClassExams,
  StudentExam,
  examsService,
} from "@/services/exams.service";

function formatSchedule(exam: StudentExam) {
  const start = new Date(exam.startsAt);
  const end = new Date(exam.endsAt);
  const time = (date: Date) =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const sameDay = start.toDateString() === end.toDateString();
  const when = sameDay
    ? `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${time(start)} – ${time(end)}`
    : start.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

  return exam.durationMinutes ? `${when} · ${exam.durationMinutes} min` : when;
}

function ExamCard({
  exam,
  action,
}: {
  exam: StudentExam;
  action: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <h3 className="text-base font-semibold text-foreground">{exam.title}</h3>
      <p className="mt-1 text-sm text-muted">
        {exam.courseName} · {exam.subjectName}
      </p>
      <p className="mt-3 text-sm text-muted">
        {formatSchedule(exam)}
      </p>
      <div className="mt-4">{action}</div>
    </article>
  );
}

export default function ClassExamsPage() {
  const { classId } = useParams<{ classId: string }>();
  const [data, setData] = useState<StudentClassExams | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examsService
      .listClassExams(classId)
      .then(setData)
      .catch((error) => {
        console.error("Erro ao buscar provas da turma:", error);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) {
    return (
      <div className="px-10 py-9">
        <p className="text-sm text-muted">Carregando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-10 py-9">
        <p>Não foi possível carregar as provas desta turma.</p>
      </div>
    );
  }

  const upcoming = data.exams.filter((exam) => !exam.finished);
  const finished = data.exams.filter((exam) => exam.finished);

  return (
    <div className="px-10 py-9">
      <p className="mb-4 text-sm text-muted">
        <Link href="/my-classes" className="hover:underline">
          Matérias
        </Link>
        {" / "}
        {data.subjectName}
      </p>
      <h1 className="mb-8 text-2xl font-bold text-foreground">Provas</h1>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Próximas avaliações</h2>
        <div className="flex max-w-xl flex-col gap-4">
          {upcoming.length > 0 ? (
            upcoming.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                action={
                  exam.available ? (
                    <Link
                      href={`/my-exams/${exam.classId}/${exam.id}`}
                      className="inline-flex rounded-full bg-[#16A34A] px-4 py-2 text-sm text-white"
                    >
                      {exam.sessionStatus === "STARTED"
                        ? "Continuar prova"
                        : "Começar prova"}
                    </Link>
                  ) : (
                    <span className="inline-flex rounded-full bg-[#16A34A]/40 px-4 py-2 text-sm text-white">
                      {exam.message}
                    </span>
                  )
                }
              />
            ))
          ) : (
            <p className="text-sm text-muted">Nenhuma prova disponível.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Finalizadas</h2>
        <div className="flex max-w-xl flex-col gap-4">
          {finished.length > 0 ? (
            finished.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                action={
                  <Link
                    href={`/my-exams/${exam.classId}/${exam.id}`}
                    className="inline-flex rounded-full bg-[#16A34A] px-4 py-2 text-sm text-white"
                  >
                    Ver detalhes
                  </Link>
                }
              />
            ))
          ) : (
            <p className="text-sm text-muted">Nenhuma prova finalizada.</p>
          )}
        </div>
      </section>
    </div>
  );
}
