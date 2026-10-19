// این مقادیر دقیقاً باید با ENUM های backend/models/course.js یکی باشن

export const GRADE_LABELS = {
  "10th": "دهم",
  "11th": "یازدهم",
  "12th": "دوازدهم",
};

export const MAJOR_LABELS = {
  math: "ریاضی",
  experimental: "تجربی",
  humanities: "انسانی",
};

export const LESSON_LABELS = {
  Mathematics: "ریاضی",
  Physics: "فیزیک",
  Chemistry: "شیمی",
  Calculus: "حسابان",
  "Discrete Geometry": "هندسه گسسته",
  Statistics: "آمار",
  Biology: "زیست‌شناسی",
  Geology: "زمین‌شناسی",
  Arabic: "عربی",
  Persian: "ادبیات فارسی",
  Religious: "دین و زندگی",
};

export const STATUS_LABELS = {
  "in-progress": "در حال برگزاری",
  finished: "به اتمام رسیده",
};

export const GRADE_OPTIONS = Object.entries(GRADE_LABELS).map(([value, label]) => ({ value, label }));
export const MAJOR_OPTIONS = Object.entries(MAJOR_LABELS).map(([value, label]) => ({ value, label }));
export const LESSON_OPTIONS = Object.entries(LESSON_LABELS).map(([value, label]) => ({ value, label }));
export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

export const COURSE_SORTS = [
  { key: "newest", label: "جدیدترین" },
  { key: "oldest", label: "قدیمی‌ترین" },
  { key: "expensive", label: "گران‌ترین" },
  { key: "cheapest", label: "ارزان‌ترین" },
];

export const WORKSHOP_SORTS = [
  { key: "newest", label: "جدیدترین" },
  { key: "oldest", label: "قدیمی‌ترین" },
  { key: "priceHigh", label: "گران‌ترین" },
  { key: "priceLow", label: "ارزان‌ترین" },
];
