"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { SchoolClass, classesService } from "@/services/classes.service";
import { Modal } from "@/components/layout/Modal";
import { extractErrorMessage } from "@/lib/extract-error-message";

function ClassCard({
  classItem,
  hidden,
  busy,
  onToggle,
}: {
  classItem: SchoolClass;
  hidden: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  const label = hidden ? "Mostrar turma" : "Ocultar turma";
  const Icon = hidden ? EyeOff : Eye;

  return (
    <article className="relative min-w-xs max-w-xs rounded-md border border-[#E2E8F0] p-8">
      <button
        type="button"
        disabled={busy}
        onClick={onToggle}
        aria-label={label}
        title={label}
        className="absolute right-3 top-3 cursor-pointer rounded-md p-1.5 text-muted hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon size={18} />
      </button>
      <Link href={`/my-classes/${classItem.id}`} className="block pr-6">
        <h2 className="mb-4 text-xl font-bold">{classItem.subjectName}</h2>
        <p className="text-sm text-muted">{classItem.courseName}</p>
      </Link>
    </article>
  );
}

export default function MyClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [hiddenOpen, setHiddenOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      const data = await classesService.listStudentClasses();
      setClasses(data);
    } catch (error) {
      console.error("Erro ao buscar turmas:", error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const closeJoin = () => {
    setJoinOpen(false);
    setCode("");
    setJoinError(null);
  };

  const handleJoin = async () => {
    const joinCode = code.trim();
    if (!joinCode) {
      setJoinError("Informe o código da sala.");
      return;
    }

    setJoining(true);
    setJoinError(null);
    try {
      await classesService.joinClass(joinCode);
      closeJoin();
      await fetchClasses();
    } catch (error) {
      console.error("Erro ao entrar na sala:", error);
      setJoinError(extractErrorMessage(error));
    } finally {
      setJoining(false);
    }
  };

  const toggleVisibility = async (classItem: SchoolClass, hidden: boolean) => {
    setTogglingId(classItem.id);
    setVisibilityError(null);
    try {
      await classesService.setStudentClassVisibility(classItem.id, hidden);
      setClasses((current) =>
        current.map((item) =>
          item.id === classItem.id ? { ...item, hidden } : item,
        ),
      );
      if (hidden) setHiddenOpen(true);
    } catch (error) {
      setVisibilityError(extractErrorMessage(error));
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="px-10 py-9">
        <p className="text-sm text-muted">Carregando...</p>
      </div>
    );
  }

  const visibleClasses = classes.filter((classItem) => !classItem.hidden);
  const hiddenClasses = classes.filter((classItem) => classItem.hidden);

  return (
    <div className="relative px-10 py-9">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex w-full justify-between p-8">
          <h1 className="text-2xl font-bold text-foreground">Matérias</h1>
          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="cursor-pointer rounded-md border bg-[#16A34A] px-4 py-2 text-white"
          >
            Entrar
          </button>
        </div>
      </div>

      {visibilityError && (
        <p className="mb-4 px-8 text-sm text-danger">{visibilityError}</p>
      )}

      <div className="flex flex-wrap gap-4 px-8">
        {visibleClasses.length > 0 ? (
          visibleClasses.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              hidden={false}
              busy={togglingId === classItem.id}
              onToggle={() => toggleVisibility(classItem, true)}
            />
          ))
        ) : (
          <div>
            {hiddenClasses.length > 0
              ? "Nenhuma turma na lista principal."
              : "Sem classes encontradas"}
          </div>
        )}
      </div>

      {hiddenClasses.length > 0 && (
        <section className="mt-8 px-8">
          <button
            type="button"
            aria-expanded={hiddenOpen}
            onClick={() => setHiddenOpen((open) => !open)}
            className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${hiddenOpen ? "rotate-180" : ""}`}
            />
            Turmas ocultas ({hiddenClasses.length})
          </button>
          {hiddenOpen && (
            <div className="mt-4 flex flex-wrap gap-4">
              {hiddenClasses.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  hidden
                  busy={togglingId === classItem.id}
                  onToggle={() => toggleVisibility(classItem, false)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <Modal
        isOpen={joinOpen}
        setIsOpen={(open) => {
          if (!open) closeJoin();
        }}
        title="Classe"
        description=""
        confirmLabel={joining ? "Entrando..." : "Entrar"}
        confirmClassName="rounded bg-[#16A34A] px-4 py-2 text-white cursor-pointer"
        confirming={joining}
        onConfirm={handleJoin}
      >
        <div className="mb-6 flex flex-col gap-1.5">
          <input
            id="join-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleJoin();
            }}
            placeholder="Código"
            className="rounded-md border border-border px-3 py-2 text-sm text-foreground"
          />
          {joinError && <p className="text-sm text-danger">{joinError}</p>}
        </div>
      </Modal>
    </div>
  );
}
