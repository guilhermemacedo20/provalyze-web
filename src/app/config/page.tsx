"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/services/auth.service";

export default function ConfigPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    authService
      .getProfile()
      .then(setProfile)
      .catch((error) => {
        console.error("Erro ao buscar perfil:", error);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const openPasswordModal = () => {
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordModalOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    setSavingPassword(true);
    try {
      await authService.changePassword({ newPassword });
      setPasswordModalOpen(false);
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      setPasswordError("Não foi possível alterar a senha. Tente novamente.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita."
      )
    )
      return;

    try {
      await authService.deleteAccount();
      router.push("/");
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
    }
  };

  return (
    <div className="relative px-10 py-9">
      <h1 className="mb-5 text-2xl font-bold text-foreground">Configurações</h1>

      <div className="relative mb-8 rounded-lg border border-border bg-surface px-7 py-6 shadow-sm">
        <div className="mb-4 flex items-center gap-4">
          <div className="size-16 shrink-0 rounded-full bg-primary-light" />
          <p className="text-lg font-semibold text-foreground">
            {loading ? "Carregando..." : profile?.name ?? "—"}
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between text-[13px]">
            <span className="text-muted">E-mail</span>
            <span className="font-medium text-foreground">
              {loading ? "..." : profile?.email ?? "—"}
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
          onClick={handleDeleteAccount}
          className="rounded-md bg-danger px-[18px] py-2.5 text-[13px] font-semibold text-white hover:opacity-90"
        >
          Excluir conta
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
              <label htmlFor="new-password" className="text-[13px] font-medium text-foreground">
                Nova senha
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              />
            </div>

            <div className="mb-2 flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-[13px] font-medium text-foreground">
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
    </div>
  );
}