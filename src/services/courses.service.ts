import { apiRequest } from "./api";

export type Course = {
  id: string;
  name: string;
  createdAt: string;
};

export const coursesService = {
  listCourses(): Promise<Course[]> {
    return apiRequest<Course[]>("/courses");
  },

  getCourse(id: string): Promise<Course> {
    return apiRequest<Course>(`/courses/${id}`);
  },

  createCourse(data: { name: string }): Promise<Course> {
    return apiRequest<Course>("/courses", { method: "POST", body: data });
  },

  deleteCourse(id: string): Promise<void> {
    return apiRequest<void>(`/courses/${id}`, { method: "DELETE" });
  },
};