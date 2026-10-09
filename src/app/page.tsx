"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { classesService } from "@/services/classes.service";
import {
  ExamListItem,
  StudentExam,
  examsService,
} from "@/services/exams.service";
import {
  reportService,
  type AdminStats,
  type StudentStats,
  type TeacherStats,
} from "@/services/report.service";
import { MetricCard } from "@/components/ui/MetricCard";
import { QuickAction } from "@/components/ui/QuickAction";
import {
  TeacherExamRow,
  StudentExamCardView,
  AdminCard,
} from "@/components/ui/CustomCard";
import { formatCount, formatAverage } from "@/utils/formatFunctions";
import { firstName } from "@/utils/firstName";

function useDashboardStats<T>() {
  const [stats, setStats] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService
      .getDashboard()
      .then((data) => setStats(data as T))
      .catch((error) => {
        console.error("Erro ao buscar estatísticas:", error);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}

function AdminDashboard() {
  const { stats, loading } = useDashboardStats<AdminStats>();
  const count = (value: number | null | undefined) =>
    formatCount(value, loading);

  return (
    <main className="px-10 py-9">
      <h1 className="mb-8 text-[26px] font-bold text-foreground">
        Painel administrativo
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard label="Total de usuários" value={count(stats?.totalUsers)} />
        <AdminCard label="Professores" value={count(stats?.totalTeachers)} />
        <AdminCard label="Alunos" value={count(stats?.totalStudents)} />
        <AdminCard label="Turmas" value={count(stats?.totalClasses)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard
          label="Avaliações criadas"
          value={count(stats?.totalExams)}
        />
        <AdminCard
          label="Avaliações realizadas"
          value={count(stats?.completedExams)}
        />
        <AdminCard
          label="Média geral da escola"
          value={formatAverage(stats?.totalAverage, loading)}
        />
      </div>
    </main>
  );
}

function TeacherDashboard({ name }: { name: string }) {
  const { stats, loading } = useDashboardStats<TeacherStats>();
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);

  useEffect(() => {
    examsService
      .listExams()
      .then((data) => {
        setExams(
          data
            .filter((exam) => exam.status !== "ENDED")
            .sort(
              (a, b) =>
                new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
            ),
        );
      })
      .catch((error) => {
        console.error("Erro ao buscar provas:", error);
        setExams([]);
      })
      .finally(() => setExamsLoading(false));
  }, []);

  return (
    <main className="flex flex-col gap-6 px-10 py-9">
      <div className="flex items-center justify-between rounded-[22px] bg-primary-light px-6 py-5">
        <h1 className="text-[26px] font-bold text-foreground">
          Olá, {firstName(name)}!
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MetricCard
          label="Provas aplicadas"
          value={formatCount(stats?.totalExams, loading)}
          tone="blue"
        />
        <MetricCard
          label="Média geral"
          value={formatAverage(stats?.totalAverage, loading)}
          tone="blue"
        />
        <MetricCard
          label="Taxa de acertos"
          value={
            loading
              ? "Carregando..."
              : stats?.hitRate == null
                ? "—"
                : `${stats.hitRate}%`
          }
          tone="blue"
        />
      </div>

      <section className="rounded-[22px] border border-border bg-surface px-6 py-5 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
        <h2 className="text-[15px] font-semibold text-foreground">
          Próximas avaliações
        </h2>
        {examsLoading ? (
          <p className="mt-4 text-[13px] text-muted">
            Carregando avaliações...
          </p>
        ) : exams.length === 0 ? (
          <p className="mt-4 text-[13px] text-muted">
            Nenhuma avaliação neste período.
          </p>
        ) : (
          <ul className="mt-2">
            {exams.map((exam) => (
              <TeacherExamRow key={exam.id} exam={exam} />
            ))}
          </ul>
        )}
      </section>

      <section className="w-full max-w-sm rounded-[22px] border border-border bg-surface px-5 py-5 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
        <h2 className="mb-4 text-[15px] font-semibold text-foreground">
          Ações rápidas
        </h2>
        <div className="flex flex-col gap-3">
          <QuickAction href="/exams/new">Criar prova</QuickAction>
          <QuickAction href="/classes/new">Criar turma</QuickAction>
          <QuickAction href="/reports">Gerar relatório</QuickAction>
        </div>
      </section>
    </main>
  );
}

function StudentDashboard({ name }: { name: string }) {
  const { stats, loading } = useDashboardStats<StudentStats>();
  const [subtitle, setSubtitle] = useState("");
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);

  useEffect(() => {
    classesService
      .listStudentClasses()
      .then(async (classes) => {
        setSubtitle(
          classes
            .map(
              (schoolClass) =>
                `${schoolClass.subjectName}`,
            )
            .join(", "),
        );
        const groups = await Promise.all(
          classes.map((schoolClass) =>
            examsService.listClassExams(schoolClass.id),
          ),
        );
        setExams(
          groups
            .flatMap((group) => group.exams)
            .filter((exam) => !exam.finished)
            .sort(
              (a, b) =>
                new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
            ),
        );
      })
      .catch((error) => {
        console.error("Erro ao buscar provas:", error);
        setExams([]);
      })
      .finally(() => setExamsLoading(false));
  }, []);

  return (
    <main className="flex flex-col gap-6 px-10 py-9">
      <div className="flex items-center justify-between rounded-[22px] bg-[#dcfce7] px-6 py-5">
        <div>
          <h1 className="text-[26px] font-bold text-foreground">
            Olá, {firstName(name)}!
          </h1>
          {subtitle ? (
            <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MetricCard
          label="Próximas provas"
          value={formatCount(stats?.upcomingExams, loading)}
          tone="green"
        />
        <MetricCard
          label="Provas concluídas"
          value={formatCount(stats?.finishedExams, loading)}
          tone="green"
        />
        <MetricCard
          label="Média geral"
          value={formatAverage(stats?.totalAverage, loading)}
          tone="green"
        />
      </div>

      <section>
        <h2 className="text-[15px] font-semibold text-foreground">
          Próximas avaliações
        </h2>
        {examsLoading ? (
          <p className="mt-4 text-[13px] text-muted">
            Carregando avaliações...
          </p>
        ) : exams.length === 0 ? (
          <p className="mt-4 text-[13px] text-muted">
            Nenhuma avaliação neste período.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {exams.map((exam) => (
              <StudentExamCardView
                key={`${exam.classId}-${exam.id}`}
                exam={exam}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "ADMIN":
    case "COORDINATOR":
      return <AdminDashboard />;
    case "TEACHER":
      return <TeacherDashboard name={user.name} />;
    case "STUDENT":
      return <StudentDashboard name={user.name} />;
    default:
      return null;
  }
}
