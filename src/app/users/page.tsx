"use client";

import { useEffect, useMemo, useState } from "react";
import { User, usersService } from "@/services/users.service";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Role } from "@/lib/role";

// lista todas as abas de filtro dos usuários.
const TABS: { key: Role | "ALL"; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "TEACHER", label: "Professores" },
  { key: "STUDENT", label: "Alunos" },
  { key: "ADMIN", label: "Administradores" },
  { key: "COORDINATOR", label: "Coordenadores" },
];

// mapeia cada tipo de usuário para o texto e cor do badge.
const ROLE_BADGE: Record<
  Role,
  { tone: "professor" | "aluno" | "admin" | "coordenador"; label: string }
> = {
  TEACHER: { tone: "professor", label: "Professor(a)" },
  STUDENT: { tone: "aluno", label: "Aluno(a)" },
  ADMIN: { tone: "admin", label: "Administrador(a)" },
  COORDINATOR: { tone: "coordenador", label: "Coordenador(a)" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Role | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("STUDENT");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // busca toda a lista de usuários novamente.
  const fetchUsers = () => {
    setLoading(true);
    usersService
      .listUsers()
      .then(setUsers)
      .catch((error) => {
        console.error("Erro ao buscar usuários:", error);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
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

  const extractErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      try {
        const parsed = JSON.parse(error.message);
        if (parsed?.message) return parsed.message;
      } catch {}
      return error.message;
    }
    return "Não foi possível concluir a ação.";
  };

  const deleteUserMessage = (user: User | null): string => {
    if (!user) return "";

    if (user.role === "ADMIN") {
      return `Tem certeza que deseja excluir o usuário "${user.name}"? Os dados pessoais dele serão anonimizados.`;
    }

    return `Tem certeza que deseja excluir o usuário "${user.name}"? Os dados pessoais dele serão anonimizados, mas o histórico de turmas é preservado.`;
  };

  const countFor = (key: Role | "ALL") =>
    key === "ALL" ? users.length : users.filter((u) => u.role === key).length;

  const openNewUserModal = () => {
    setNewName("");
    setNewEmail("");
    setNewRole("STUDENT");
    setFormError(null);
    setEditingUserId(null);
    setModalMode("create");
  };

  const openEditUserModal = (user: User) => {
    setNewName(user.name);
    setNewEmail(user.email);
    setNewRole(user.role);
    setFormError(null);
    setEditingUserId(user.id);
    setModalMode("edit");
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim() || !newEmail.trim()) {
      setFormError("Preencha nome e e-mail.");
      return;
    }

    setCreating(true);
    try {
      const data = {
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
      };

      if (modalMode === "edit" && editingUserId) {
        await usersService.updateUser(editingUserId, data);
      } else {
        await usersService.createUser(data);
      }

      setModalMode(null);
      fetchUsers();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      setFormError(extractErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await usersService.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      fetchUsers();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      setDeleteError(extractErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative px-10 py-9">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <button
          type="button"
          onClick={openNewUserModal}
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
            {loading && ( // renderização condicional.
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
                <tr
                  key={user.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {user.name}
                  </td>
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
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => openEditUserModal(user)}
                        className="font-medium text-primary hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(user);
                        }}
                        className="font-medium text-muted hover:text-danger"
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

      {modalMode !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleSubmitUser}
            className="w-[420px] rounded-lg bg-surface p-8 shadow-lg"
          >
            <h2 className="mb-6 text-center text-lg font-semibold text-foreground">
              {modalMode === "edit" ? "Editar usuário" : "Novo usuário"}
            </h2>

            <div className="mb-4 flex flex-col gap-1.5">
              <label
                htmlFor="new-name"
                className="text-[13px] font-medium text-foreground"
              >
                Nome
              </label>
              <input
                id="new-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              />
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
              <label
                htmlFor="new-email"
                className="text-[13px] font-medium text-foreground"
              >
                E-mail
              </label>
              <input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              />
            </div>

            <div className="mb-2 flex flex-col gap-1.5">
              <label
                htmlFor="new-role"
                className="text-[13px] font-medium text-foreground"
              >
                Perfil
              </label>
              <select
                id="new-role"
                value={newRole}
                // "as UserRole": o <select> sempre entrega texto puro (string).
                onChange={(e) => setNewRole(e.target.value as Role)}
                className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              >
                <option value="STUDENT">Aluno(a)</option>
                <option value="TEACHER">Professor(a)</option>
                <option value="COORDINATOR">Coordenador(a)</option>
                <option value="ADMIN">Administrador(a)</option>
              </select>
            </div>

            {formError && (
              <p className="mb-2 text-[13px] text-danger">{formError}</p>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="rounded-md border border-border px-[18px] py-2.5 text-[13px] font-semibold text-foreground hover:bg-background"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {creating
                  ? "Salvando..."
                  : modalMode === "edit"
                    ? "Salvar alterações"
                    : "Criar usuário"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir usuário"
        message={deleteUserMessage(deleteTarget)}
        error={deleteError}
        confirming={deleting}
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
