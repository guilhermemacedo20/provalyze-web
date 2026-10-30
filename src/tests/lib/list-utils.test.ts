import { describe, expect, it } from "vitest";
import {
  compareNames,
  matchesSearch,
  normalizeText,
  paginate,
} from "@/lib/list-utils";

describe("list-utils", () => {
  it("normaliza acento e maiúsculas", () => {
    expect(normalizeText("Álgebra Linear")).toBe("algebra linear");
  });

  it("ordena nomes ignorando acento e maiúsculas", () => {
    const names = ["Zebra", "álgebra", "Banco", "ética"];

    expect([...names].sort(compareNames)).toEqual([
      "álgebra",
      "Banco",
      "ética",
      "Zebra",
    ]);
  });

  it("busca sem diferenciar acento e ignora espaços nas pontas", () => {
    expect(matchesSearch("Engenharia de Software", "  SOFTWARE ")).toBe(true);
    expect(matchesSearch("Álgebra", "algebra")).toBe(true);
    expect(matchesSearch("Álgebra", "banco")).toBe(false);
    expect(matchesSearch("Álgebra", "")).toBe(true);
  });

  it("pagina a lista e limita a página atual", () => {
    const items = Array.from({ length: 45 }, (_, index) => index + 1);

    const first = paginate(items, 1, 20);
    expect(first.items).toHaveLength(20);
    expect(first.totalPages).toBe(3);

    const last = paginate(items, 3, 20);
    expect(last.items).toEqual([41, 42, 43, 44, 45]);

    const beyond = paginate(items, 99, 20);
    expect(beyond.currentPage).toBe(3);

    const empty = paginate([], 5, 20);
    expect(empty.currentPage).toBe(1);
    expect(empty.totalPages).toBe(1);
    expect(empty.items).toEqual([]);
  });
});