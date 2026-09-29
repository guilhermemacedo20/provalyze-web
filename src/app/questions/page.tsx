"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Modal } from "@/components/layout/Modal";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { questionsService } from "@/services/questions.service";
import { Theme, themesService } from "@/services/themes.service";

export default function QuestionsPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchThemes = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const themeList = await themesService.listThemes();
      const questions = await questionsService.listQuestions();

      setThemes(
        themeList.map((theme) => ({
          ...theme,
          count: questions.filter((q) => q.themeId === theme.id).length ?? 0,
        })),
      );
    } catch (error) {
      console.error("Error fetching themes:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!themeToDelete) {
      return;
    }
    await themesService.deleteTheme(themeToDelete.id);
    setThemeToDelete(null);
    fetchThemes(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setName("");
    setCreateError(null);
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setCreateError("Informe o nome da pasta.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await themesService.createTheme({ name: trimmed });
      closeCreate();
      await fetchThemes(true);
    } catch (error) {
      console.error("Error creating theme:", error);
      setCreateError(extractErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  if (loading) {
    return (
      <main className="px-10 pt-9">
        <p className="text-[13px] text-muted">Carregando pastas...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-background px-10 pb-10 pt-9">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-foreground">
            Banco de Questões
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Suas questões organizadas por tema
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="cursor-pointer rounded-[14px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover"
        >
          + Nova pasta
        </button>
      </div>

      {themes.length === 0 ? (
        <p className="rounded-[22px] border border-border bg-surface px-5 py-8 text-[13px] text-muted">
          Nenhuma pasta cadastrada. Crie um tema para começar a adicionar
          questões.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {themes.map((theme) => {
            return (
              <div
                key={theme.id}
                className="relative rounded-[22px] border border-border bg-surface p-6 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]"
              >
                <button
                  type="button"
                  aria-label={`Excluir tema ${theme.name}`}
                  className="absolute right-6 top-6 cursor-pointer"
                  onClick={() => setThemeToDelete(theme)}
                >
                  <Image
                    src="/icons/trash.png"
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 object-contain opacity-70 hover:opacity-100"
                  />
                </button>

                <Link href={`/themes/${theme.id}`} className="block pr-8">
                  <div className="mb-5 flex size-10 items-center justify-center rounded-[10px] bg-primary-light">
                    <Image
                      src="/icons/folder.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="size-5"
                    />
                  </div>

                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-[16px] font-semibold text-foreground">
                      {theme.name}
                    </h2>
                    <p className="shrink-0 text-[13px] text-muted">
                      {theme.count === 1
                        ? "1 questão"
                        : `${theme.count} questões`}
                    </p>
                  </div>

                  <p className="mt-5 text-[13px] font-medium text-primary">
                    Abrir pasta →
                  </p>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={themeToDelete !== null}
        setIsOpen={(open) => {
          if (!open) {
            setThemeToDelete(null);
          }
        }}
        title="Confirmar exclusão"
        description={
          themeToDelete
            ? `Excluir a pasta "${themeToDelete.name}"? As questões vinculadas também serão excluídas.`
            : ""
        }
        onConfirm={confirmDelete}
      />

      <Modal
        isOpen={createOpen}
        setIsOpen={(open) => {
          if (!open) closeCreate();
        }}
        title="Nova pasta"
        description=""
        confirmLabel={creating ? "Criando..." : "Criar"}
        confirmClassName="rounded-[14px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover cursor-pointer"
        confirming={creating}
        onConfirm={handleCreate}
      >
        <div className="mb-6 flex flex-col gap-1.5">
          <label htmlFor="theme-name" className="text-sm font-medium text-foreground">
            Nome
          </label>
          <input
            id="theme-name"
            value={name}
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleCreate();
            }}
            placeholder="Nome da pasta"
            className="rounded-md border border-border px-3 py-2 text-sm text-foreground"
          />
          {createError && <p className="text-sm text-danger">{createError}</p>}
        </div>
      </Modal>
    </main>
  );
}
