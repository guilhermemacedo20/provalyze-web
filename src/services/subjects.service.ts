import { apiRequest } from "./api";

export type Subject = {
  id: string;
  name: string;
  courseId: string;
  createdAt: string;
};

export type SubjectOption = {
  id: string;
  name: string;
  courseName: string;
};

export const subjectsService = {
  listSubjects(courseId: string): Promise<Subject[]> {
    return apiRequest<Subject[]>(`/courses/${courseId}/subjects`);
  },

  listAllSubjects(): Promise<SubjectOption[]> {
    return apiRequest<SubjectOption[]>("/subjects");
  },

  createSubject(courseId: string, data: { name: string }): Promise<Subject> {
    return apiRequest<Subject>(`/courses/${courseId}/subjects`, {
      method: "POST",
      body: data,
    });
  },

  deleteSubject(courseId: string, subjectId: string): Promise<void> {
    return apiRequest<void>(`/courses/${courseId}/subjects/${subjectId}`, {
      method: "DELETE",
    });
  },
};