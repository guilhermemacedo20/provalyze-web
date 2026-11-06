import { describe, expect, it } from "vitest";
import {
  canAccessPath,
  isExamAuthoringPath,
  isQuestionBankPath,
  navItemsForRole,
} from "@/config/nav";

describe("nav", () => {
  it("filtra itens por role", () => {
    const teacherItems = navItemsForRole("TEACHER");
    expect(teacherItems.some((item) => item.href === "/exams")).toBe(true);
    expect(teacherItems.some((item) => item.href === "/users")).toBe(false);
  });

  it("identifica rotas do banco de questões", () => {
    expect(isQuestionBankPath("/questions")).toBe(true);
    expect(isQuestionBankPath("/themes/new")).toBe(true);
    expect(isQuestionBankPath("/exams")).toBe(false);
  });

  it("identifica rotas de edição de prova", () => {
    expect(isExamAuthoringPath("/exams/new")).toBe(true);
    expect(isExamAuthoringPath("/exams/abc/edit")).toBe(true);
    expect(isExamAuthoringPath("/exams/abc")).toBe(false);
  });

  it("permite professor no banco de questões e bloqueia aluno", () => {
    expect(canAccessPath("/questions", "TEACHER")).toBe(true);
    expect(canAccessPath("/questions", "STUDENT")).toBe(false);
  });

  it("respeita papéis nas rotas do menu", () => {
    expect(canAccessPath("/users", "ADMIN")).toBe(true);
    expect(canAccessPath("/users", "STUDENT")).toBe(false);
    expect(canAccessPath("/my-classes", "STUDENT")).toBe(true);
  });
  it("mostra Meu desempenho só para o aluno", () => {
    const studentItems = navItemsForRole("STUDENT");
    expect(studentItems.some((item) => item.href === "/my-performance")).toBe(
      true,
    );
    expect(
      navItemsForRole("TEACHER").some((item) => item.href === "/my-performance"),
    ).toBe(false);
    expect(canAccessPath("/my-performance", "STUDENT")).toBe(true);
    expect(canAccessPath("/my-performance", "TEACHER")).toBe(false);
  });
});
