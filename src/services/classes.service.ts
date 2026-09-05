import { apiRequest } from "./api";

export type SchoolClass = {
  id: string;
  name: string;
  teacherName: string;
  subjectName: string;
  courseName: string;
  studentsCount: number;
  averageScore: number | null;
};

export const classesService = {
  listClasses(): Promise<SchoolClass[]> {
    return apiRequest<SchoolClass[]>("/classes");
  },

  createClass(data: {
    name: string;
    subjectId: string;
    teacherId: string;
  }): Promise<SchoolClass> {
    return apiRequest<SchoolClass>("/classes", { method: "POST", body: data });
  },

  deleteClass(id: string): Promise<void> {
    return apiRequest<void>(`/classes/${id}`, { method: "DELETE" });
  },
};