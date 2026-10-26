import { describe, expect, it } from "vitest";
import {
  completeDuration,
  durationToMinutes,
  formatDateTime,
  formatFullPeriod,
  formatPeriod,
  formatPoints,
  formatScore,
  fromLocalInput,
  initials,
  maskDuration,
  minutesToDuration,
  pluralize,
  toLocalInput,
} from "@/lib/exam-format";

describe("exam-format", () => {
  it("mascara e converte duração", () => {
    expect(maskDuration("0130")).toBe("01:30");
    expect(completeDuration("01:05")).toBe("01:05");
    expect(durationToMinutes("01:30")).toBe(90);
    expect(durationToMinutes("00:00")).toBeNull();
    expect(minutesToDuration(90)).toBe("01:30");
    expect(minutesToDuration(null)).toBe("");
  });

  it("formata datas locais e períodos", () => {
    process.env.TZ = "UTC";
    const start = "2026-06-01T10:00:00.000Z";
    const end = "2026-06-01T12:00:00.000Z";
    expect(formatPeriod(start, end)).toBe("01/06 10h00 : 12h00");
    expect(formatDateTime(start)).toContain("01/06/2026");
    expect(fromLocalInput("2026-06-01T10:00")).toMatch(/2026-06-01T/);
    expect(toLocalInput(start)).toMatch(/2026-06-01T/);
    expect(formatFullPeriod(start, end)).toContain("01/06/2026");
  });

  it("formata pontos, notas e textos auxiliares", () => {
    expect(formatPoints(1)).toBe("1 pt");
    expect(formatPoints(10)).toContain("pts");
    expect(formatScore(7.5)).toBe("7,5");
    expect(formatScore(null)).toBe("-");
    expect(pluralize(1, "questão", "questões")).toBe("1 questão");
    expect(pluralize(2, "questão", "questões")).toBe("2 questões");
    expect(initials("Ana Silva")).toBe("AS");
  });
});
