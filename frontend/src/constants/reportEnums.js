// دقیقاً منطبق با ENUM دیتابیس (models/dailyReportLesson.js) و رنگ/برچسب نسخه‌ی اصلی UI

export const REPORT_SUBJECTS = [
  "ریاضی",
  "هندسه",
  "ریاضیات گسسته",
  "آمار",
  "حسابان",
  "فیزیک",
  "شیمی",
  "زیست‌شناسی",
  "زمین‌شناسی",
  "عربی",
  "ادبیات فارسی",
  "دین و زندگی",
  "علوم و فنون",
  "جامعه شناسی",
  "تاریخ",
  "جغرافیا",
  "زبان",
  "فلسفه",
  "منطق"
];

export const ACTIVITY_TYPES = [
  { value: "review_cycle", label: "جمع‌بندی/دوره", color: "blue" },
  { value: "practice_review", label: "مرور/تمرین", color: "green" },
  { value: "new_topic", label: "مبحث جدید", color: "red" },
  { value: "not_done", label: "انجام نشده", color: "gray" },
];

export const ACTIVITY_BADGE = {
  review_cycle: "badge-blue",
  practice_review: "badge-teal",
  new_topic: "badge-coral",
  not_done: "badge-gray",
};

export function activityLabel(value) {
  return ACTIVITY_TYPES.find((a) => a.value === value)?.label || "انجام نشده";
}
