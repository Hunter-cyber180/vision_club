import api from "./client";

export async function createLesson(payload) {
  const { data } = await api.post("/lessons", payload);
  return data.data;
}

export async function updateLesson(id, payload) {
  const { data } = await api.put(`/lessons/${id}`, payload);
  return data.data;
}

export async function deleteLesson(id) {
  const { data } = await api.delete(`/lessons/${id}`);
  return data;
}
