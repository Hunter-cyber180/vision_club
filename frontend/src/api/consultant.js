import api from "./client";

// ---- دانش‌آموزان مشاور ----
export async function fetchMyStudents() {
  const { data } = await api.get("/consultant/students");
  return data.data || [];
}

export async function searchCandidates(search) {
  const { data } = await api.get("/consultant/candidates", { params: { search } });
  return data.data || [];
}

export async function addStudent(userId) {
  const { data } = await api.post(`/consultant/students/${userId}`);
  return data.data;
}

export async function removeStudent(userId) {
  const { data } = await api.delete(`/consultant/students/${userId}`);
  return data.data;
}

export async function fetchStudentInfo(userId) {
  const { data } = await api.get(`/consultant/students/${userId}`);
  return data.data;
}

export async function fetchStudentReports(userId) {
  const { data } = await api.get(`/consultant/students/${userId}/daily-reports`);
  return data.data || [];
}

export async function fetchStudentAnalyses(userId) {
  const { data } = await api.get(`/consultant/students/${userId}/analysis-exams`);
  return data.data || [];
}

export async function fetchStudentPayments(userId) {
  const { data } = await api.get(`/consultant/students/${userId}/tuition-payments`);
  return data.data || [];
}

// آمار هفته‌ی اخیر دانش‌آموز برای نمودارهای تب «نمای کلی»
export async function fetchStudentWeeklyStats(userId) {
  const { data } = await api.get(`/consultant/students/${userId}/weekly-stats`);
  return data.data;
}

export async function fetchStudentSchedules(userId) {
  const { data } = await api.get(`/consultant/students/${userId}/weekly-schedules`);
  return data.data || [];
}

export async function sendWeeklySchedule(userId, payload) {
  const { data } = await api.post(`/consultant/students/${userId}/weekly-schedule`, payload);
  return data.data;
}

// تعیین/ویرایش مبلغ شهریه‌ی ماهانه‌ی دانش‌آموز (تا خودش از کیف پول پرداختش کنه)
export async function setStudentTuitionAmount(userId, tuition_amount) {
  const { data } = await api.patch(`/consultant/students/${userId}/tuition-amount`, { tuition_amount });
  return data.data;
}

// تغییر دستی وضعیت پرداخت‌شده/پرداخت‌نشده‌ی شهریه‌ی ماه جاری (یا ماه مشخص‌شده)
export async function changeTuitionStatus(userId, status, extra = {}) {
  const { data } = await api.patch(`/consultant/tuition-payments/${userId}`, { status, ...extra });
  return data.data;
}

// ---- شهریه (کل دانش‌آموزان مشاور) ----
export async function fetchUnpaidTuitions() {
  const { data } = await api.get("/consultant/tuition-payments/unpaid");
  return data.data || [];
}

export async function fetchPaidTuitions() {
  const { data } = await api.get("/consultant/tuition-payments/paid");
  return data.data || [];
}

// ---- پروفایل/تنظیمات حساب خود مشاور ----
export async function updateMyConsultantAccount(payload) {
  const { data } = await api.put("/consultant/auth/me", payload);
  return data.consultant;
}
