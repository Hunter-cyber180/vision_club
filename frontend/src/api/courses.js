import api from "./client";

// params: { page, limit, sort, grade, major, course_lesson_name, price_type, status, search }
export async function fetchCourses(params = {}) {
  const { data } = await api.get("/courses", { params });
  return data.data; // { courses, pagination, filters, sort }
}

export async function fetchCourseById(id) {
  const { data } = await api.get(`/courses/${id}`);
  return data.data ?? data.course;
}

// ثبت‌نام مستقیم (رایگان — یا برای دانش‌آموزهایی که همه‌چیز براشون رایگانه)
export async function purchaseCourse(course_id) {
  const { data } = await api.post("/user-panel/user-courses/purchase", { course_id });
  return data;
}

// ---- مدیریت کلاس‌ها توسط مشاور ----
export async function fetchMyClasses(consultantId, params = {}) {
  const { data } = await api.get("/courses", { params: { consultant_id: consultantId, approval_status: "all", limit: 100, ...params } });
  return data.data.courses || [];
}

export async function createCourse(payload) {
  const { data } = await api.post("/courses", payload);
  return data.data;
}

export async function updateCourse(id, payload) {
  const { data } = await api.put(`/courses/${id}`, payload);
  return data.data;
}

export async function deleteCourse(id) {
  const { data } = await api.delete(`/courses/${id}`);
  return data;
}

// ---- مدیریت همه‌ی کلاس‌ها توسط ادمین (بدون فیلتر consultant_id) ----
export async function fetchAllClasses(params = {}) {
  const { data } = await api.get("/courses", { params: { approval_status: "all", limit: 100, ...params } });
  return data.data.courses || [];
}

// فقط ادمین: تایید/رد یک کلاس
export async function changeCourseApproval(id, approval_status) {
  const { data } = await api.patch(`/courses/${id}/approval`, { approval_status });
  return data.data;
}
