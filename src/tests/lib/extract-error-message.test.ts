import { describe, expect, it } from "vitest";
import { extractErrorMessage } from "@/lib/extract-error-message";

describe("extractErrorMessage", () => {
  it("extrai message string de erro JSON da API", () => {
    const error = new Error(
      JSON.stringify({ message: "Usuário ou senha inválidos" }),
    );
    expect(extractErrorMessage(error)).toBe("Usuário ou senha inválidos");
  });

  it("junta array de mensagens de validação", () => {
    const error = new Error(
      JSON.stringify({ message: ["Campo inválido", "Senha fraca"] }),
    );
    expect(extractErrorMessage(error)).toBe("Campo inválido. Senha fraca");
  });

  it("retorna message quando não é JSON", () => {
    expect(extractErrorMessage(new Error("Falha de rede"))).toBe("Falha de rede");
  });

  it("retorna fallback para valores desconhecidos", () => {
    expect(extractErrorMessage("generic")).toBe(
      "Não foi possível concluir a ação.",
    );
  });
});
