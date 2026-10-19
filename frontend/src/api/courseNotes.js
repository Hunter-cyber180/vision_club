import api from "./client";

export async function fetchCourseNotes(courseId) {
  const { data } = await api.get(`/courses/${courseId}/notes`);
  return data.data || [];
}

export async function createCourseNote(courseId, payload) {
  const { data } = await api.post(`/courses/${courseId}/notes`, payload);
  return data.data;
}

export async function deleteCourseNote(id) {
  const { data } = await api.delete(`/courses/notes/${id}`);
  return data;
}
