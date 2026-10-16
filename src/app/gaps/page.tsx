"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { GapReport, reportService } from "@/services/report.service";
import { classesService, SchoolClass } from "@/services/classes.service";
import { themeTone } from "@/utils/themeTone";

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none rounded-full border border-border bg-surface py-2 pl-4 pr-9 text-sm text-foreground"
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
      />
    </label>
  );
}

export default function GapsPage() {
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState<SchoolClass[] | null>(null);
  const [gaps, setGaps] = useState<GapReport[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      const data = await classesService.listClasses();
      setClasses(data);
    } catch (error) {
      console.error("Erro ao buscar turmas:", error);
      setClasses([]);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    reportService
      .getGaps(classId)
      .then((data) => {
        if (cancelled) return;
        setGaps(data);
        setError(null);
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(extractErrorMessage(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [classId]);

  return (
    <div className="px-10 py-9">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-4 flex-col">
          <h1 className="text-2xl font-bold text-foreground">
            Insights Pedagógicos
          </h1>
          <p className="text-[#64748B]">
            A IA aponta padrões nas respostas para ajudar você a decidir onde
            focar.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <FilterSelect
            label="Turma"
            value={classId}
            onChange={(value) => {
              setClassId(value);
            }}
          >
            <option value="">Turma: Todas</option>
            {classes?.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                Turma: {schoolClass.name} - {schoolClass.subjectName}
              </option>
            ))}
          </FilterSelect>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <article className="rounded-2xl border border-border bg-surface p-5">
        {loading && !gaps ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : !loading && gaps?.length === 0 ? (
          <p className="text-sm text-muted">Nenhum gap encontrado.</p>
        ) : (
          <ul className="space-y-4">
            {gaps?.map((gap) => {
              const tone = themeTone(gap.percent);
              return (
                <div key={gap.theme} className="flex gap-2 flex-col ">
                  <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-foreground justify-between">
                    <div className="flex gap-2">
                      <span className="bg-[#2563EB] text-white px-2 py-1 rounded-2xl border text-sm">
                        IA
                      </span>
                      <span>{gap.theme}</span>
                    </div>
                    <span className={`align-end font-semibold ${tone.text}`}>
                      {gap.percent}% de acerto
                    </span>
                  </h2>
                  <div>
                    <p className="text-[#64748B] font-semibold">EVIDÊNCIA</p>
                    <p>{gap.evidence}</p>
                  </div>
                  <div className="bg-[#F2F6FE] rounded-2xl border border-border p-4">
                    <p className="text-[#1D4ED8] font-semibold">
                      SUGESTÃO PEDAGÓGICA
                    </p>
                    <p>{gap.suggestion}</p>
                  </div>
                </div>
              );
            })}
          </ul>
        )}
      </article>
    </div>
  );
}
