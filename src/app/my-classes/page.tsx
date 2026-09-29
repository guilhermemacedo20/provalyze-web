"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SchoolClass, classesService } from "@/services/classes.service";
import { Modal } from "@/components/layout/Modal";
import { extractErrorMessage } from "@/lib/extract-error-message";

export default function MyClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="px-10 py-9">
        <p className="text-sm text-muted">Carregando...</p>
      </div>
    );
  }

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
      <div className="flex gap-4">
        {classes.length > 0 ? (
          classes.map((classItem) => (
            <Link
              key={classItem.id}
              className="flex border rounded-md p-8 min-w-xs max-w-xs border-[#E2E8F0] cursor-pointer"
              href={`/my-classes/${classItem.id}`}
            >
              <div>
                <h2 className="text-xl font-bold mb-4">{classItem.subjectName}</h2>
                <p>{classItem.name}</p>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-8">Sem classes encontradas</div>
        )}
      </div>

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
