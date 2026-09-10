import { apiRequest } from "./api";

export type Course = {
  id: string;
  name: string;
  createdAt: string;
};

export const coursesService = { // agrupa todas as funções dentro de um único objeto.
  // busca todos os cursos cadastrados.
  listCourses() {
    return apiRequest<Course[]>("/courses");
  },
  // busca um único curso pelo id.
  getCourse(id: string) {
    return apiRequest<Course>(`/courses/${id}`);
  },
  // cria um novo curso.
  createCourse(data: { name: string }) {
    return apiRequest<Course>("/courses", { method: "POST", body: data });
  },
  // deleta um curso.
  deleteCourse(id: string) {
    return apiRequest<void>(`/courses/${id}`, { method: "DELETE" });
  },
};