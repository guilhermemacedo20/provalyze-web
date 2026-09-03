"use client";

import { useEffect, useMemo, useState } from "react";
import { User, UserRole, usersService } from "@/services/users.service";
import { Badge } from "@/components/ui/Badge";

const TABS: { key: UserRole | "ALL"; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "TEACHER", label: "Professores" },
  { key: "STUDENT", label: "Alunos" },
  { key: "ADMIN", label: "Administradores" },
];

const ROLE_BADGE: Record<UserRole, { tone: "professor" | "aluno" | "admin"; label: string }> = {
  TEACHER: { tone: "professor", label: "Professor(a)" },
  STUDENT: { tone: "aluno", label: "Aluno(a)" },
  ADMIN: { tone: "admin", label: "Administrador(a)" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<UserRole | "ALL">("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    usersService
      .listUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesTab = activeTab === "ALL" || user.role === activeTab;
      const matchesSearch =
        search.trim() === "" ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [users, activeTab, search]);

  const countFor = (key: UserRole | "ALL") =>
    key === "ALL" ? users.length : users.filter((u) => u.role === key).length;

  return (
    <div className="px-10 py-9">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          + Novo usuário
        </button>
      </div>

      <div className="mb-5 inline-flex gap-1 rounded-md border border-border bg-surface p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-sm px-4 py-2 text-[13px] font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label} ({countFor(tab.key)})
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Pesquisar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-5 w-full max-w-[728px] rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted"
      />

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted">
              <th className="px-5 py-3">NOME</th>
              <th className="px-5 py-3">E-MAIL</th>
              <th className="px-5 py-3">PERFIL</th>
              <th className="px-5 py-3">TURMAS</th>
              <th className="px-5 py-3">CADASTRO</th>
              <th className="px-5 py-3">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-muted">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-muted">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-3.5 font-medium text-foreground">{user.name}</td>
                  <td className="px-5 py-3.5 text-muted">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={ROLE_BADGE[user.role].tone}>
                      {ROLE_BADGE[user.role].label}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {user.classes.length > 0 ? user.classes.join(", ") : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-muted">{user.createdAt}</td>
                  <td className="px-5 py-3.5">
                    <button type="button" className="font-medium text-primary hover:underline">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}