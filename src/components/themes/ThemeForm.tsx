"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { themesService } from "@/services/themes.service";
import { Modal } from "../layout/Modal";

export function ThemeForm({ themeId }: { themeId?: string }) {
  const router = useRouter();
  const isEdit = !!themeId;
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [themeToDelete, setThemeToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!themeId) {
      return;
    }

    async function loadTheme() {
      try {
        if (!themeId) {
          return;
        }
        setLoading(true);
        const theme = await themesService.getTheme(themeId);
        setName(theme.name);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        console.error("Error loading theme:", err);
        setError("Não foi possível carregar o tema.");
      }
    }

    loadTheme();
  }, [themeId]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Informe o nome do tema.");
      return;
    }

    try {
      if (themeId) {
        await themesService.updateTheme(themeId, { name: trimmed });
        router.push(`/themes/${themeId}`);
      } else {
        const created = await themesService.createTheme({ name: trimmed });
        router.push(`/themes/${created.id}`);
      }
    } catch (err) {
      console.error("Error saving theme:", err);
      setError(
        themeId
          ? "Não foi possível atualizar o tema. Verifique se o nome já existe."
          : "Não foi possível criar o tema. Verifique se o nome já existe.",
      );
    }
  };

  const deleteTheme = async () => {
    if (!themeId) {
      return;
    }

    try {
      await themesService.deleteTheme(themeId);
      router.push("/questions");
    } catch (err) {
      console.error("Error deleting theme:", err);
      setError("Não foi possível excluir o tema.");
    }
  };

  const fieldClass =
    "w-full rounded-[14px] border border-border bg-surface px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted";

  if (loading) {
    <main className="px-10 pt-9">
      <p className="text-[13px]">Carregando...</p>
    </main>;
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-surface px-10 pb-10 pt-9">
      <p className="text-[12px] text-muted">
        Temas / {isEdit ? "Editar" : "Novo tema"}
      </p>

      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold text-foreground">
          {isEdit ? "Editar tema" : "Novo tema"}
        </h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-[728px] space-y-5 rounded-[22px] border border-border bg-surface p-7 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]"
      >
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-[13px] font-medium">
            Nome
          </label>
          <input
            id="name"
            type="text"
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
        </div>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() =>
              router.push(themeId ? `/themes/${themeId}` : "/questions")
            }
            className="text-[13px] font-medium text-muted cursor-pointer hover:text-foreground"
          >
            Voltar
          </button>
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={() => themeId && setThemeToDelete(themeId)}
                className="rounded-[14px] bg-danger px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-danger-hover disabled:opacity-50 cursor-pointer mr-3"
              >
                Excluir
              </button>
            )}
            <button
              type="submit"
              className="rounded-[14px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
            >
              {isEdit ? "Salvar alterações" : "Criar"}
            </button>
          </div>
        </div>
      </form>
      <Modal
        isOpen={!!themeToDelete}
        setIsOpen={() => setThemeToDelete(null)}
        title="Excluir tema"
        description="Tem certeza que deseja excluir este tema?"
        onConfirm={deleteTheme}
      />
    </main>
  );
}
