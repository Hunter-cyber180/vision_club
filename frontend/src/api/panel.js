import api from "./client";

// ---- دوره‌ها/کارگاه‌های من ----
export async function fetchMyCourses(userId) {
  const { data } = await api.get(`/user-panel/user-courses/user/${userId}`);
  return data.data || [];
}

export async function fetchMyWorkshops(userId) {
  const { data } = await api.get(`/user-panel/user-workshops/user/${userId}`);
  return data.data || [];
}

// ---- پروفایل / تنظیمات حساب ----
export async function updateMyAccount(payload) {
  const { data } = await api.put("/auth/me", payload);
  return data.user;
}

// ---- گزارش کار روزانه (فقط role=student) ----
export async function fetchMyDailyReports(params = {}) {
  const { data } = await api.get("/user-panel/daily-reports/mine", { params });
  return data.data || [];
}

export async function createDailyReport(payload) {
  const { data } = await api.post("/user-panel/daily-reports", payload);
  return data.data;
}

// ---- تحلیل آزمون (فقط role=student) ----
export async function fetchMyAnalysisExams() {
  const { data } = await api.get("/user-panel/analysis-exams/mine");
  return data.data || [];
}

export async function createAnalysisExam(payload) {
  const { data } = await api.post("/user-panel/analysis-exams", payload);
  return data.data;
}

// ---- برنامه‌ی هفتگی (فقط role=student) ----
export async function fetchMyWeeklySchedules() {
  const { data } = await api.get("/user-panel/mine/weekly-schedules");
  return data.data || [];
}

// آمار هفته‌ی اخیر خودِ دانش‌آموز، برای نمودارهای داشبورد
export async function fetchMyWeeklyStats() {
  const { data } = await api.get("/user-panel/mine/weekly-stats");
  return data.data;
}

// ---- کیف پول ----
export async function fetchMyWallet() {
  const { data } = await api.get("/user-panel/mine/charges");
  return data.data; // { balance, charges }
}

export async function createWalletCheckout(amount) {
  const { data } = await api.post("/checkout", { amount });
  return data; // { paymentUrl, checkout }
}

// ---- شهریه (فقط role=student) ----
export async function fetchMyTuitionPayments() {
  const { data } = await api.get("/user-panel/mine/tuition-payments");
  return data.data || [];
}

export async function payTuitionFromWallet() {
  const { data } = await api.post("/user-panel/mine/tuition-payments/pay");
  return data.data; // { tuitionPayment, balance }
}
