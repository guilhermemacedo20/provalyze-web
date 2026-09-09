"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { dashboardService, AdminStats } from "@/services/dashboard.service";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-lg border border-border bg-surface px-5 py-[18px] shadow-sm">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="text-[30px] font-bold text-foreground">{value}</p>
    </div>
  );
}

function TeacherDashboardPlaceholder() {
  return (
    <p className="text-muted">
      Painel do Professor — em construção.
    </p>
  );
}

function StudentDashboardPlaceholder() {
  return (
    <p className="text-muted">
      Painel do Aluno — em construção.
    </p>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ADMIN" | "TEACHER" | "STUDENT">("ADMIN");

  useEffect(() => {
    dashboardService
      .getAdminStats()
      .then(setStats)
      .catch((error) => {
        console.error("Erro ao buscar estatísticas:", error);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (value: number | undefined | null) =>
    loading || value === undefined || value === null ? "..." : value.toLocaleString("pt-BR");

  return (
    <div className="px-10 py-9">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Painel administrativo</h1>

        <div className="flex gap-1 rounded-md border border-border bg-surface p-1">
          {(["ADMIN", "TEACHER", "STUDENT"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-sm px-4 py-2 text-[13px] font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab === "ADMIN" ? "Admin" : tab === "TEACHER" ? "Professor" : "Aluno"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "TEACHER" && <TeacherDashboardPlaceholder />}
      {activeTab === "STUDENT" && <StudentDashboardPlaceholder />}
      {activeTab === "ADMIN" && (
        <>
          <div className="mb-4 flex gap-4">
            <StatCard label="TOTAL DE USUÁRIOS" value={fmt(stats?.totalUsers)} />
            <StatCard label="PROFESSORES" value={fmt(stats?.teachers)} />
            <StatCard label="ALUNOS" value={fmt(stats?.students)} />
            <StatCard label="TURMAS" value={fmt(stats?.classes)} />
          </div>
          <div className="flex gap-4">
            <StatCard label="AVALIAÇÕES CRIADAS" value={fmt(stats?.examsCreated)} />
            <StatCard label="AVALIAÇÕES REALIZADAS" value={fmt(stats?.examsTaken)} />
            <StatCard
              label="MÉDIA GERAL DA ESCOLA"
              value={
                loading || stats?.schoolAverage == null
                  ? "..."
                  : stats.schoolAverage.toFixed(1).replace(".", ",")
              }
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const role = user?.role ?? "STUDENT";

  if (role === "ADMIN") {
    return <AdminDashboard />;
  }

  return (
    <main className="px-10 pt-9">
      <h1 className="text-[26px] font-bold">Dashboard</h1>
      <p className="mt-2 text-muted">Visão geral</p>
    </main>
  );
}