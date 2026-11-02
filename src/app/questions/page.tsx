"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/layout/Modal";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { questionsService } from "@/services/questions.service";
import { Theme, themesService } from "@/services/themes.service";

const THEMES_PER_PAGE = 8;

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function QuestionsPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
    try {
      await themesService.deleteTheme(themeToDelete.id);
      setThemeToDelete(null);
      fetchThemes(true);
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    }
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

  const filteredThemes = useMemo(() => {
    const term = normalize(search.trim());

    return themes
      .filter((theme) => normalize(theme.name).includes(term))
      .sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
      );
  }, [themes, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredThemes.length / THEMES_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const visibleThemes = filteredThemes.slice(
    (currentPage - 1) * THEMES_PER_PAGE,
    currentPage * THEMES_PER_PAGE,
  );

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

      {themes.length > 0 && (
        <div className="relative max-w-md">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            aria-label="Pesquisar pastas"
            placeholder="Pesquisar..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-[14px] border border-border bg-surface py-2.5 pl-10 pr-3.5 text-[13px] text-foreground placeholder:text-muted"
          />
        </div>
      )}

      {themes.length === 0 ? (
        <p className="rounded-[22px] border border-border bg-surface px-5 py-8 text-[13px] text-muted">
          Nenhuma pasta cadastrada. Crie um tema para começar a adicionar
          questões.
        </p>
      ) : filteredThemes.length === 0 ? (
        <p className="rounded-[22px] border border-border bg-surface px-5 py-8 text-[13px] text-muted">
          Nenhuma pasta encontrada para &quot;{search.trim()}&quot;.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visibleThemes.map((theme) => (
              <div
                key={theme.id}
                className="relative rounded-[16px] border border-border bg-surface p-4 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]"
              >
                <button
                  type="button"
                  aria-label={`Excluir tema ${theme.name}`}
                  className="absolute right-4 top-4 cursor-pointer"
                  onClick={() => setThemeToDelete(theme)}
                >
                  <Image
                    src="/icons/trash.png"
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 object-contain opacity-70 hover:opacity-100"
                  />
                </button>

                <Link href={`/themes/${theme.id}`} className="block pr-6">
                  <div className="mb-3 flex size-8 items-center justify-center rounded-[8px] bg-primary-light">
                    <Image
                      src="/icons/folder.svg"
                      alt=""
                      width={16}
                      height={16}
                      className="size-4"
                    />
                  </div>

                  <h2
                    title={theme.name}
                    className="truncate text-[14px] font-semibold text-foreground"
                  >
                    {theme.name}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {theme.count === 1
                      ? "1 questão"
                      : `${theme.count} questões`}
                  </p>

                  <p className="mt-3 text-[12px] font-medium text-primary">
                    Abrir pasta →
                  </p>
                </Link>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Paginação das pastas"
              className="flex items-center justify-center gap-3"
            >
              <button
                type="button"
                aria-label="Página anterior"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-[13px] text-muted">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                aria-label="Próxima página"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </nav>
          )}
        </>
      )}

      <Modal
        isOpen={themeToDelete !== null}
        setIsOpen={(open) => {
          if (!open) {
            setThemeToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Confirmar exclusão"
        description={
          themeToDelete
            ? `Excluir a pasta "${themeToDelete.name}"? As questões vinculadas também serão excluídas.`
            : ""
        }
        onConfirm={confirmDelete}
      >
        {deleteError && (
          <p className="mb-4 text-[13px] text-danger">{deleteError}</p>
        )}
      </Modal>

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
