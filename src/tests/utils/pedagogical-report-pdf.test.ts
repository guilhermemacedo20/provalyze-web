import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PedagogicalReportDetail } from "@/services/report.service";
import { downloadPedagogicalReportPdf } from "@/utils/pedagogical-report-pdf";

const toBlob = vi.fn();

vi.mock("@react-pdf/renderer", () => ({
  pdf: vi.fn(() => ({ toBlob })),
  Document: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  Page: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  Text: ({ children }: { children: React.ReactNode }) =>
    React.createElement("span", null, children),
  View: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  StyleSheet: { create: (styles: unknown) => styles },
}));

const report: PedagogicalReportDetail = {
  id: "r1",
  title: "Mat: Turma A",
  className: "Turma A",
  subjectName: "Mat",
  authorName: "Prof",
  analysisType: "BOTH",
  createdAt: "2026-01-15T12:00:00.000Z",
  content: {
    average: 7.5,
    median: 7,
    hitRate: 70,
    themes: [{ name: "Lógica", percent: 80 }],
    students: [
      {
        name: "Bruno",
        exams: [{ title: "Prova 1", score: 8 }],
      },
    ],
    gaps: [
      {
        theme: "Lógica",
        percent: 40,
        evidence: "Erros em questões básicas",
        suggestion: "Revisar operadores",
      },
    ],
  },
};

describe("downloadPedagogicalReportPdf", () => {
  const createObjectURL = vi.fn(() => "blob:mock");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    toBlob.mockResolvedValue(
      new Blob(["pdf-bytes"], { type: "application/pdf" }),
    );
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });
  });

  it("gera blob PDF e dispara download no navegador", async () => {
    const click = vi.fn();
    const link = document.createElement("a");
    link.click = click;
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(link);

    await downloadPedagogicalReportPdf(report);

    expect(toBlob).toHaveBeenCalled();
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(link.download).toContain("Mat");
    expect(link.download.endsWith(".pdf")).toBe(true);
    expect(click).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("gera PDF só de lacunas", async () => {
    const gapsOnly: PedagogicalReportDetail = {
      ...report,
      analysisType: "GAPS",
      content: {
        average: null,
        median: null,
        hitRate: null,
        themes: [],
        students: [],
        gaps: [],
      },
    };

    await downloadPedagogicalReportPdf(gapsOnly);
    expect(toBlob).toHaveBeenCalled();
  });

  it("gera PDF só de desempenho com listas vazias", async () => {
    const performanceOnly: PedagogicalReportDetail = {
      ...report,
      analysisType: "PERFORMANCE",
      content: {
        average: null,
        median: null,
        hitRate: null,
        themes: [],
        students: [],
        gaps: [],
      },
    };

    await downloadPedagogicalReportPdf(performanceOnly);
    expect(toBlob).toHaveBeenCalled();
  });
});
