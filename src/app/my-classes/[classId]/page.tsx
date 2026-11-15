"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";
import { paginate } from "@/lib/list-utils";
import {
  StudentClassExams,
  StudentExam,
  examsService,
} from "@/services/exams.service";

const EXAMS_PER_PAGE = 10;

function formatSchedule(exam: StudentExam) {
  const start = new Date(exam.startsAt);
  const end = new Date(exam.endsAt);
  const time = (date: Date) =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const sameDay = start.toDateString() === end.toDateString();
  const when = sameDay
    ? `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${time(start)} - ${time(end)}`
    : start.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

  return exam.durationMinutes ? `${when} · ${exam.durationMinutes} min` : when;
}

function ExamCard({ exam, action }: { exam: StudentExam; action: ReactNode }) {
  return (
    <article className="flex min-h-72 w-56 shrink-0 snap-start flex-col rounded-xl border border-[#E2E8F0] bg-white p-5">
      <h3 className="break-words text-base font-semibold text-foreground">
        {exam.title}
      </h3>
      <p className="mt-2 text-sm text-muted">
        {exam.courseName} · {exam.subjectName}
      </p>
      <p className="mt-3 text-sm text-muted">{formatSchedule(exam)}</p>
      <div className="mt-auto pt-6">{action}</div>
    </article>
  );
}

function ExamRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex snap-x gap-4 overflow-x-auto pb-3">{children}</div>
  );
}

export default function ClassExamsPage() {
  const { classId } = useParams<{ classId: string }>();
  const [data, setData] = useState<StudentClassExams | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [finishedPage, setFinishedPage] = useState(1);

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

  const upcoming = paginate(
    data.exams.filter((exam) => !exam.finished),
    upcomingPage,
    EXAMS_PER_PAGE,
  );
  const finished = paginate(
    data.exams.filter((exam) => exam.finished),
    finishedPage,
    EXAMS_PER_PAGE,
  );

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
        {upcoming.items.length > 0 ? (
          <ExamRow>
            {upcoming.items.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                action={
                  exam.available ? (
                    <Link
                      href={`/my-exams/${exam.classId}/${exam.id}`}
                      className="flex justify-center rounded-full bg-[#16A34A] px-4 py-2 text-sm text-white"
                    >
                      {exam.sessionStatus === "STARTED"
                        ? "Continuar prova"
                        : "Começar prova"}
                    </Link>
                  ) : (
                    <span className="flex justify-center rounded-full bg-[#16A34A]/40 px-4 py-2 text-center text-sm text-white">
                      {exam.message}
                    </span>
                  )
                }
              />
            ))}
          </ExamRow>
        ) : (
          <p className="text-sm text-muted">Nenhuma prova disponível.</p>
        )}
        <div className="mt-4">
          <Pagination
            page={upcoming.currentPage}
            totalPages={upcoming.totalPages}
            onPageChange={setUpcomingPage}
            label="Paginação das próximas avaliações"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Finalizadas</h2>
        {finished.items.length > 0 ? (
          <ExamRow>
            {finished.items.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                action={
                  <Link
                    href={`/my-exams/${exam.classId}/${exam.id}`}
                    className="flex justify-center rounded-full bg-[#16A34A] px-4 py-2 text-sm text-white"
                  >
                    Ver detalhes
                  </Link>
                }
              />
            ))}
          </ExamRow>
        ) : (
          <p className="text-sm text-muted">Nenhuma prova finalizada.</p>
        )}
        <div className="mt-4">
          <Pagination
            page={finished.currentPage}
            totalPages={finished.totalPages}
            onPageChange={setFinishedPage}
            label="Paginação das provas finalizadas"
          />
        </div>
      </section>

      <Link
        href="/my-classes"
        className="mt-10 inline-block rounded-[14px] bg-success px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90"
      >
        ← Voltar
      </Link>
    </div>
  );
}