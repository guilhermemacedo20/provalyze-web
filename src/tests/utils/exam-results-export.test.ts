import { describe, expect, it, vi } from "vitest";
import type { ExamResult } from "@/services/exams.service";
import { buildResultRows, resultsHeader } from "@/utils/exam-results-export";

vi.mock("@react-pdf/renderer", () => ({
  pdf: vi.fn(),
  Document: () => null,
  Page: () => null,
  Text: () => null,
  View: () => null,
  StyleSheet: { create: (styles: unknown) => styles },
}));

vi.mock("exceljs", () => ({ Workbook: vi.fn() }));

const results: ExamResult[] = [
  {
    classId: "c1",
    className: "Turma A",
    name: "Ana Souza",
    status: "GRADED",
    score: 8.5,
    deliveredAt: "2026-11-05T12:00:00.000Z",
  },
  {
    classId: "c1",
    className: "Turma A",
    name: "Bruno Lima",
    status: "FINISHED",
    score: null,
    deliveredAt: "2026-11-05T12:10:00.000Z",
  },
  {
    classId: "c2",
    className: "Turma B",
    name: "Carla Dias",
    status: "NOT_STARTED",
    score: null,
    deliveredAt: null,
  },
];

describe("buildResultRows", () => {
  it("monta uma linha por aluno com nome, nota e status traduzido", () => {
    expect(buildResultRows(results)).toEqual([
      {
        name: "Ana Souza",
        className: "Turma A",
        score: 8.5,
        status: "Corrigida",
      },
      {
        name: "Bruno Lima",
        className: "Turma A",
        score: null,
        status: "Aguardando correção",
      },
      {
        name: "Carla Dias",
        className: "Turma B",
        score: null,
        status: "Não iniciada",
      },
    ]);
  });

  it("devolve lista vazia quando não há resultados", () => {
    expect(buildResultRows([])).toEqual([]);
  });
});

describe("resultsHeader", () => {
  const exam = {
    title: "Prova 1",
    classes: [
      {
        id: "c1",
        name: "Turma A",
        subjectName: "Mat",
        courseName: "ES",
        studentsCount: 10,
      },
      {
        id: "c2",
        name: "Turma B",
        subjectName: "Mat",
        courseName: "ES",
        studentsCount: 8,
      },
    ],
    startsAt: "2026-11-05T11:00:00.000Z",
    endsAt: "2026-11-05T13:00:00.000Z",
  };

  it("monta o cabeçalho com prova, turmas e data", () => {
    const header = resultsHeader(exam);

    expect(header.title).toBe("Prova 1");
    expect(header.classNames).toBe("Turma A, Turma B");
    expect(header.date).toContain("05/11/2026");
  });

  it("mostra só a turma filtrada", () => {
    expect(resultsHeader(exam, "c2").classNames).toBe("Turma B");
  });

  it("indica quando a prova não tem turma", () => {
    expect(resultsHeader({ ...exam, classes: [] }).classNames).toBe(
      "Sem turma",
    );
  });
});
