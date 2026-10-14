"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LegalFooter } from "@/components/ui/LegalFooter";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { User, usersService } from "@/services/users.service";
import { clearSession } from "@/lib/auth-role-storage";
import { isPasswordStrong } from "@/lib/password-validate";
import { PasswordChecks } from "@/components/auth/PasswordChecks";

const PRIVACY_EMAIL = "provalyze@gmail.com";

function DeleteAccountMessage({ role }: { role?: User["role"] }) {
  const isRemoved = role === "ADMIN" || role === "COORDINATOR";

  return (
    <div className="flex flex-col gap-3">
      <p>
        Tem certeza que deseja excluir sua conta e seus dados? Essa ação não
        pode ser desfeita e você perderá o acesso ao sistema.
      </p>

      {isRemoved ? (
        <div>
          <p className="font-semibold text-foreground">O que será removido:</p>
          <ul className="mt-1 list-disc pl-5">
            <li>Seu nome e seu e-mail.</li>
            <li>Seu acesso ao sistema.</li>
          </ul>
        </div>
      ) : (
        <>
          <div>
            <p className="font-semibold text-foreground">
              Dados que serão anonimizados:
            </p>
            <ul className="mt-1 list-disc pl-5">
              <li>Seu nome completo.</li>
              <li>Seu e-mail.</li>
            </ul>
            <p className="mt-1">
              Eles serão substituídos por valores genéricos, e você não poderá
              mais entrar com esta conta.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground">
              O que permanece, sem identificar você:
            </p>
            <p className="mt-1">
              O histórico acadêmico (turmas e avaliações) fica registrado de
              forma anônima por <strong>5 anos</strong>, para preservar a
              integridade dos dados da turma.
            </p>
          </div>
        </>
      )}

      <p>
        Para esclarecer dúvidas, entre em contato pelo e-mail{" "}
        <a
          href={`mailto:${PRIVACY_EMAIL}`}
          className="font-medium text-primary hover:underline"
        >
          {PRIVACY_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}

export default function ConfigPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [confirmingDeleteAccount, setConfirmingDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    authService
      .me()
      .then(setProfile)
      .catch((error) => {
        console.error("Erro ao buscar perfil:", error);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordModalOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!profile?.email) {
      setPasswordError("Não foi possível identificar o e-mail da conta.");
      return;
    }
    if (currentPassword.length < 8) {
      setPasswordError("A senha atual precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      setPasswordError("A senha não atende aos requisitos listados abaixo.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("A nova senha deve ser diferente da atual.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    setSavingPassword(true);
    try {
      await authService.changePassword({
        email: profile.email,
        actualPassword: currentPassword,
        newPassword,
      });
      setPasswordModalOpen(false);
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      setPasswordError(extractErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  const openDeleteAccount = () => {
    setDeleteError(null);
    setConfirmingDeleteAccount(true);
  };

  const confirmDeleteAccount = async () => {
    if (!profile) return;

    setDeletingAccount(true);
    setDeleteError(null);
    try {
      await usersService.deleteUser(profile.id);
      clearSession();
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      setDeleteError(extractErrorMessage(error));
      setDeletingAccount(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col px-10 py-9">
      <h1 className="mb-5 text-2xl font-bold text-foreground">Configurações</h1>

      <div className="relative mb-8 rounded-lg border border-border bg-surface px-7 py-6 shadow-sm">
        <div className="mb-4 flex items-center gap-4">
          <div className="size-16 shrink-0 rounded-full bg-primary-light" />
          <p className="text-lg font-semibold text-foreground">
            {loading ? "Carregando..." : profile?.name}
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between text-[13px]">
            <span className="text-muted">E-mail</span>
            <span className="font-medium text-foreground">
              {loading ? "..." : profile?.email}
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted">Senha</span>
            <div className="flex items-center gap-3">
              <span className="font-medium text-foreground">••••••••</span>
              <button
                type="button"
                onClick={openPasswordModal}
                className="rounded-md border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-background"
              >
                Alterar senha
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={openDeleteAccount}
          className="rounded-md bg-danger px-[18px] py-2.5 text-[13px] font-semibold text-white hover:opacity-90"
        >
          Excluir conta e dados
        </button>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleChangePassword}
            className="w-[420px] rounded-lg bg-surface p-8 shadow-lg"
          >
            <h2 className="mb-6 text-center text-lg font-semibold text-foreground">
              Alterar senha
            </h2>

            <div className="mb-4 flex flex-col gap-1.5">
              <label
                htmlFor="current-password"
                className="text-[13px] font-medium text-foreground"
              >
                Senha atual
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              />
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
              <label
                htmlFor="new-password"
                className="text-[13px] font-medium text-foreground"
              >
                Nova senha
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              />
              <PasswordChecks password={newPassword} />
            </div>

            <div className="mb-2 flex flex-col gap-1.5">
              <label
                htmlFor="confirm-password"
                className="text-[13px] font-medium text-foreground"
              >
                Confirmar nova senha
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              />
            </div>

            {passwordError && (
              <p className="mb-2 text-[13px] text-danger">{passwordError}</p>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {savingPassword ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirmingDeleteAccount}
        title="Excluir conta e dados"
        message={<DeleteAccountMessage role={profile?.role} />}
        error={deleteError}
        confirmLabel="Excluir conta e dados"
        confirming={deletingAccount}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setConfirmingDeleteAccount(false)}
      />

      <LegalFooter />
    </div>
  );
}