import api from "./client";

// ---- داشبورد / امور مالی ----
export async function fetchFinanceSummary() {
  const { data } = await api.get("/admin/finance/summary");
  return data.data;
}

export async function fetchFinanceTransactions(params = {}) {
  const { data } = await api.get("/admin/finance/transactions", { params });
  return { transactions: data.data || [], pagination: data.pagination };
}

export async function fetchUnpaidStudents(params = {}) {
  const { data } = await api.get("/admin/finance/unpaid-students", { params });
  return data.data || [];
}

// ---- کاربران/دانش‌آموزان ----
export async function fetchAllPeople(search = "") {
  const { data } = await api.get("/admin/people", { params: { search } });
  return data.data || [];
}

export async function setUserRole(userId, payload) {
  const { data } = await api.patch(`/admin/${userId}/role`, payload);
  return data.data;
}

export async function updateAdminUser(userId, payload) {
  const { data } = await api.put(`/admin/users/${userId}`, payload);
  return data.data;
}

export async function deleteAdminUser(userId) {
  const { data } = await api.delete(`/admin/users/${userId}`);
  return data;
}

// ---- مشاوران ----
export async function fetchConsultants(params = {}) {
  const { data } = await api.get("/admin/consultants", { params });
  return data.data || [];
}

export async function fetchConsultantById(id) {
  const { data } = await api.get(`/admin/consultants/${id}`);
  return data.data;
}

export async function fetchConsultantStudents(id, params = {}) {
  const { data } = await api.get(`/admin/consultants/${id}/students`, { params });
  return { students: data.data || [], pagination: data.pagination };
}

export async function createConsultant(payload) {
  const { data } = await api.post("/admin/consultants", payload);
  return data.data;
}

export async function updateConsultant(id, payload) {
  const { data } = await api.put(`/admin/consultants/${id}`, payload);
  return data.data;
}

export async function deleteConsultant(id) {
  const { data } = await api.delete(`/admin/consultants/${id}`);
  return data;
}

// ---- پروفایل/تنظیمات حساب خود ادمین ----
export async function updateMyAdminAccount(payload) {
  const { data } = await api.put("/admin/auth/me", payload);
  return data.admin;
}
