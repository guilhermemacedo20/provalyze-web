"use client";

import { useEffect, useMemo, useState } from "react";
import { User, UserRole, usersService } from "@/services/users.service";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// lista todas as abas de filtro dos usuários.
const TABS: { key: UserRole | "ALL"; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "TEACHER", label: "Professores" },
  { key: "STUDENT", label: "Alunos" },
  { key: "ADMIN", label: "Administradores" },
];

// mapeia cada tipo de usuário para o texto e cor do badge.
const ROLE_BADGE: Record<UserRole, { tone: "professor" | "aluno" | "admin"; label: string }> = {
  TEACHER: { tone: "professor", label: "Professor(a)" },
  STUDENT: { tone: "aluno", label: "Aluno(a)" },
  ADMIN: { tone: "admin", label: "Administrador(a)" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]); // guarda a lista de usuários.
  const [loading, setLoading] = useState(true); // controle de espera.
  const [activeTab, setActiveTab] = useState<UserRole | "ALL">("ALL"); // guarda qual é a aba que está selecionada.
  const [search, setSearch] = useState(""); // guarda o texto que foi digitado na busca.

  // controla o modal: "create" (Novo usuário), "edit" (Editar usuário) ou null (fechado).
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null); // id do usuário sendo editado (null em modo criação).
  const [newName, setNewName] = useState(""); // nome digitado no formulário do modal.
  const [newEmail, setNewEmail] = useState(""); // e-mail digitado no formulário do modal.
  const [newRole, setNewRole] = useState<UserRole>("STUDENT"); // perfil escolhido no formulário do modal.
  const [creating, setCreating] = useState(false); // controla se o formulário está no meio de um envio.
  const [formError, setFormError] = useState<string | null>(null); // mensagem de erro do formulário do modal.

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null); // guarda qual usuário será excluído.
  const [deleting, setDeleting] = useState(false); // controla se a exclusão está em andamento.

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

  // busca os usuários, roda apenas quando a tela monta pela primeira vez.
  useEffect(() => {
    fetchUsers();
  }, []);

  // recalcula a lista filtrada quando algo relevante muda.
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

  // conta quantos usuários existem em cada aba.
  const countFor = (key: UserRole | "ALL") =>
    key === "ALL" ? users.length : users.filter((u) => u.role === key).length;

  // limpa o formulário e abre o modal em modo criação.
  const openNewUserModal = () => {
    setNewName("");
    setNewEmail("");
    setNewRole("STUDENT");
    setFormError(null);
    setEditingUserId(null);
    setModalMode("create");
  };

  // preenche o formulário com os dados do usuário e abre o modal em modo edição.
  const openEditUserModal = (user: User) => {
    setNewName(user.name);
    setNewEmail(user.email);
    setNewRole(user.role);
    setFormError(null);
    setEditingUserId(user.id);
    setModalMode("edit");
  };

  // valida e envia o formulário — cria um usuário novo ou atualiza um existente,dependendo do modalMode.
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim() || !newEmail.trim()) {
      setFormError("Preencha nome e e-mail.");
      return;
    }

    setCreating(true);
    try {
      const data = { name: newName.trim(), email: newEmail.trim(), role: newRole };

      if (modalMode === "edit" && editingUserId) {
        await usersService.updateUser(editingUserId, data);
      } else {
        await usersService.createUser(data);
      }

      setModalMode(null);
      fetchUsers();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      setFormError("Não foi possível salvar o usuário. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  // executa a exclusão de verdade, chamada pelo botão de confirmar do modal.
  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersService.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      fetchUsers();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    // "relative" é necessário pro modal (fixed inset-0) se posicionar corretamente.
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
                        onClick={() => setDeleteTarget(user)}
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
              <label htmlFor="new-name" className="text-[13px] font-medium text-foreground">
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
              <label htmlFor="new-email" className="text-[13px] font-medium text-foreground">
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
              <label htmlFor="new-role" className="text-[13px] font-medium text-foreground">
                Perfil
              </label>
              <select
                id="new-role"
                value={newRole}
                // "as UserRole": o <select> sempre entrega texto puro (string).
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              >
                <option value="STUDENT">Aluno(a)</option>
                <option value="TEACHER">Professor(a)</option>
                <option value="ADMIN">Administrador(a)</option>
              </select>
            </div>

            {formError && <p className="mb-2 text-[13px] text-danger">{formError}</p>}

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

      {/* modal de confirmação de exclusão — abre quando deleteTarget não é nulo. */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir usuário"
        message={`Tem certeza que deseja excluir o usuário "${deleteTarget?.name}"?`}
        confirming={deleting}
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}