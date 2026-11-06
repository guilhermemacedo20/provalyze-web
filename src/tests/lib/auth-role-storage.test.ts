import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSession,
  examDraftKey,
  getAccessToken,
  getStoredUser,
  saveSession,
} from "@/lib/auth-role-storage";
import type { User } from "@/services/users.service";

const sampleUser: User = {
  id: "user-1",
  name: "Aluno",
  email: "aluno@escola.com",
  role: "STUDENT",
  classes: [],
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("auth-role-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persiste token e usuário na sessão", () => {
    saveSession("token-abc", sampleUser);

    expect(getAccessToken()).toBe("token-abc");
    expect(getStoredUser()).toEqual(sampleUser);
  });

  it("limpa sessão e rascunhos de prova", () => {
    window.localStorage.setItem("provalyze-exam-user-1-exam-1", "{}");
    saveSession("token-abc", sampleUser);

    clearSession();

    expect(getAccessToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
    expect(
      window.localStorage.getItem("provalyze-exam-user-1-exam-1"),
    ).toBeNull();
  });

  it("gera chave estável de rascunho de prova", () => {
    expect(examDraftKey("user-1", "exam-9")).toBe(
      "provalyze-exam-user-1-exam-9",
    );
  });
});
