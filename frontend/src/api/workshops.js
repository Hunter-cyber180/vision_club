import api from "./client";

// params: { page, limit, sort, category_id, price_type, search }
export async function fetchWorkshops(params = {}) {
  const { data } = await api.get("/workshops", { params });
  return { workshops: data.data, pagination: data.pagination };
}

export async function fetchWorkshopById(id) {
  const { data } = await api.get(`/workshops/${id}`);
  return data.data;
}

// ثبت‌نام مستقیم (رایگان — یا برای دانش‌آموزهایی که همه‌چیز براشون رایگانه)
export async function purchaseWorkshop(workshop_id) {
  const { data } = await api.post("/user-panel/user-workshops/purchase", { workshop_id });
  return data;
}

// ---- مدیریت کارگاه‌ها توسط ادمین ----
export async function createWorkshop(payload) {
  const { data } = await api.post("/workshops", payload);
  return data.data;
}

export async function updateWorkshop(id, payload) {
  const { data } = await api.put(`/workshops/${id}`, payload);
  return data.data;
}

export async function deleteWorkshop(id) {
  const { data } = await api.delete(`/workshops/${id}`);
  return data;
}

// فقط ادمین: تایید/رد کارگاهی که یک مشاور ساخته — دقیقاً مثل changeCourseApproval
export async function changeWorkshopApproval(id, approval_status) {
  const { data } = await api.patch(`/workshops/${id}/approval`, { approval_status });
  return data.data;
}
