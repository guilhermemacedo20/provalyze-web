import { apiRequest } from "./api";

export type Theme = {
  id: string;
  name: string;
  createdAt?: string;
  count?: number;
};

export const themesService = {
  listThemes(): Promise<Theme[]> {
    return apiRequest("/themes");
  },

  getTheme(id: string): Promise<Theme> {
    return apiRequest(`/themes/${id}`);
  },

  createTheme(data: { name: string }) {
    return apiRequest<Theme>("/themes", { method: "POST", body: data });
  },

  updateTheme(id: string, data: { name: string }) {
    return apiRequest<Theme>(`/themes/${id}`, { method: "PATCH", body: data });
  },

  deleteTheme(id: string) {
    return apiRequest<Theme>(`/themes/${id}`, { method: "DELETE" });
  },
};
