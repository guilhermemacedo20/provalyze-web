import { describe, expect, it } from "vitest";
import { formatAverage, formatCount, formatDashDate } from "@/utils/formatFunctions";

describe("formatDashDate", () => {
  it("formata data e hora no padrão dd/mm - HHhMM", () => {
    process.env.TZ = "UTC";
    expect(formatDashDate("2026-03-15T14:30:00.000Z")).toBe("15/03 - 14h30");
  });
});

describe("formatCount", () => {
  it("retorna Carregando... enquanto loading", () => {
    expect(formatCount(10, true)).toBe("Carregando...");
  });

  it("retorna traço quando valor é nulo", () => {
    expect(formatCount(null, false)).toBe("-");
  });

  it("formata número em pt-BR", () => {
    expect(formatCount(1500, false)).toBe("1.500");
  });
});

describe("formatAverage", () => {
  it("retorna Carregando... enquanto loading", () => {
    expect(formatAverage(7.5, true)).toBe("Carregando...");
  });

  it("retorna traço quando valor é nulo", () => {
    expect(formatAverage(undefined, false)).toBe("-");
  });

  it("formata média com uma casa decimal", () => {
    expect(formatAverage(7.56, false)).toBe("7,6");
  });
});
