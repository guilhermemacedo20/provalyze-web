"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { classesService, JoinRequest } from "@/services/classes.service";
import { extractErrorMessage } from "@/lib/extract-error-message";

type Props = {
  classId: string;
  onApproved?: () => void;
};

type Action = "approve" | "reject";

export function JoinRequestsPanel({ classId, onApproved }: Props) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setRequests(await classesService.listJoinRequests(classId));
    } catch (err) {
      console.error("Erro ao buscar solicitações de entrada:", err);
      setError(extractErrorMessage(err));
    }
  }, [classId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const allSelected = requests.length > 0 && selected.size === requests.length;
  const someSelected = selected.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const toggleAll = () => {
    setSelected(
      allSelected ? new Set() : new Set(requests.map((request) => request.id)),
    );
  };

  const toggleOne = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const decide = async (action: Action) => {
    const ids = [...selected];
    if (ids.length === 0) return;

    setBusy(action);
    setError(null);
    setNotice(null);
    try {
      if (action === "approve") {
        const { approved } = await classesService.approveJoinRequests(
          classId,
          ids,
        );
        setNotice(
          `${approved} ${approved === 1 ? "aluno aprovado" : "alunos aprovados"}.`,
        );
      } else {
        const { rejected } = await classesService.rejectJoinRequests(
          classId,
          ids,
        );
        setNotice(
          `${rejected} ${rejected === 1 ? "solicitação recusada" : "solicitações recusadas"}.`,
        );
      }
      setSelected(new Set());
      await fetchRequests();
      if (action === "approve") onApproved?.();
    } catch (err) {
      console.error("Erro ao responder solicitações:", err);
      setError(extractErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (requests.length === 0 && !notice && !error) {
    return null;
  }

  return (
    <section
      aria-label="Solicitações de entrada"
      className="mb-6 overflow-hidden rounded-lg border border-[#FDE68A] bg-surface shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFBEB] px-5 py-3">
        <div>
          <h2 className="text-[14px] font-semibold text-foreground">
            Solicitações de entrada ({requests.length})
          </h2>
          <p className="text-[12px] text-muted">
            Alunos que digitaram o código da turma e aguardam a sua aprovação.
          </p>
        </div>

        {requests.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-muted">
              {selected.size} {selected.size === 1 ? "selecionado" : "selecionados"}
            </span>
            <button
              type="button"
              onClick={() => decide("reject")}
              disabled={selected.size === 0 || busy !== null}
              className="cursor-pointer rounded-md border border-danger px-3 py-1.5 text-[13px] font-semibold text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "reject" ? "Recusando..." : "Recusar selecionados"}
            </button>
            <button
              type="button"
              onClick={() => decide("approve")}
              disabled={selected.size === 0 || busy !== null}
              className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "approve" ? "Aprovando..." : "Aprovar selecionados"}
            </button>
          </div>
        )}
      </div>

      {error && <p className="px-5 pt-3 text-[13px] text-danger">{error}</p>}
      {notice && (
        <p role="status" className="px-5 pt-3 text-[13px] text-[#166534]">
          {notice}
        </p>
      )}

      {requests.length > 0 && (
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted">
              <th className="w-12 px-5 py-3">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  aria-label="Selecionar todos"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-4 cursor-pointer"
                />
              </th>
              <th className="px-3 py-3">ALUNO</th>
              <th className="px-3 py-3">E-MAIL</th>
              <th className="px-5 py-3">SOLICITADO EM</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr
                key={request.id}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-5 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${request.student.name}`}
                    checked={selected.has(request.id)}
                    onChange={() => toggleOne(request.id)}
                    className="size-4 cursor-pointer"
                  />
                </td>
                <td className="px-3 py-3 font-medium text-foreground">
                  {request.student.name}
                </td>
                <td className="px-3 py-3 text-muted">{request.student.email}</td>
                <td className="px-5 py-3 text-muted">
                  {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}