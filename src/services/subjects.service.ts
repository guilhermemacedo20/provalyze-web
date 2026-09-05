import { apiRequest } from "./api"; 
// representa uma matéria cadastrada e que sempre estará vinculada a um curso.
export type Subject = {
  id: string;
  name: string;
  courseId: string; // refere-se a que curso ela está vinculada.
  createdAt: string; // data da criação.
};

// versão da matéria já com o curso embutido.
export type SubjectOption = {
  id: string;
  name: string;
  courseName: string;
};

export const subjectsService = { // agrupa todas as funções dentro de um único objeto.
    // busca as matérias de um curso expecífico.
  listSubjects(courseId: string) { 
    return apiRequest<Subject[]>(`/courses/${courseId}/subjects`);
  },
    // busca as matérias de todos os cursos.
  listAllSubjects() {
    return apiRequest<SubjectOption[]>("/subjects");
  },
    // cria uma nova matéria dentro de um curso.
  createSubject(courseId: string, data: { name: string }) {
    return apiRequest<Subject>(`/courses/${courseId}/subjects`, {
      method: "POST",
      body: data,
    });
  },
    // remove a matéria de um curso.
  deleteSubject(courseId: string, subjectId: string) { 
    return apiRequest<void>(`/courses/${courseId}/subjects/${subjectId}`, {
      method: "DELETE",
    });
  },
};