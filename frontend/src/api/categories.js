import api from "./client";

export async function fetchCategories() {
  const { data } = await api.get("/admin/categories");
  return data.data || [];
}

// فقط ادمین
export async function createCategory(payload) {
  const { data } = await api.post("/admin/categories", payload);
  return data.data;
}
