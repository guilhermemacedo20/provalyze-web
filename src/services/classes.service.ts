import { apiRequest } from "./api";

export type SchoolClass = { // representa dados apenas de leitura, o tipo só vai carregar aquilo que a tela realmente usa.
  id: string;
  name: string;
  teacherName: string;
  subjectName: string;
  courseName: string;
  studentsCount: number;
  averageScore: number | null; 
};

export const classesService = { // agrupa todas as funções dentro de um único objeto.
    // busca todas as turmas.
    listClasses() {
    return apiRequest<SchoolClass[]>("/classes");
  },
    // cria uma turma nova.
  createClass(data: {name: string;subjectId: string;teacherId: string;}) {
    return apiRequest<SchoolClass>("/classes", { method: "POST", body: data });
  },
    // remove uma turma.
  deleteClass(id: string) {
    return apiRequest<void>(`/classes/${id}`, { method: "DELETE" });
  },
};