import { describe, expect, it } from "vitest";
import { getPasswordChecks, isPasswordStrong } from "@/lib/password-validate";

describe("password-validate", () => {
  it("marca todos os requisitos quando senha é forte", () => {
    const checks = getPasswordChecks("Senha123");
    expect(checks.every((item) => item.met)).toBe(true);
    expect(isPasswordStrong("Senha123")).toBe(true);
  });

  it("falha quando falta maiúscula ou número", () => {
    expect(isPasswordStrong("senha123")).toBe(false);
    expect(isPasswordStrong("SenhaForte")).toBe(false);
    expect(isPasswordStrong("Curta1")).toBe(false);
  });
});
