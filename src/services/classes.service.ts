import { apiRequest } from "./api";

export type SchoolClass = {
  id: string;
  name: string;
  joinCode: string;
  teacherName: string;
  subjectName: string;
  courseName: string;
  studentsCount: number;
  averageScore: number | null;
};

export type ClassStudent = {
  id: string;
  name: string;
  email: string;
};

export type ClassDetail = {
  id: string;
  name: string;
  joinCode: string;
  teacherName: string;
  subjectName: string;
  courseName: string;
  students: ClassStudent[];
};

export const classesService = {
  listClasses() {
    return apiRequest<SchoolClass[]>("/classes");
  },

  getClass(id: string) {
    return apiRequest<ClassDetail>(`/classes/${id}`);
  },

  createClass(data: { name: string; subjectId: string; teacherId: string }) {
    return apiRequest<SchoolClass>("/classes", { method: "POST", body: data });
  },

  addStudent(classId: string, studentId: string) {
    return apiRequest<void>(`/classes/${classId}/students`, {
      method: "POST",
      body: { studentId },
    });
  },

  removeStudent(classId: string, studentId: string) {
    return apiRequest<void>(`/classes/${classId}/students/${studentId}`, {
      method: "DELETE",
    });
  },

  deleteClass(id: string) {
    return apiRequest<void>(`/classes/${id}`, { method: "DELETE" });
  },
};