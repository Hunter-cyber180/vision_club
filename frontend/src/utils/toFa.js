const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFa(n) {
  return String(n).replace(/[0-9]/g, (x) => FA_DIGITS[x]);
}

export function formatToman(amount) {
  if (!amount) return "رایگان";
  return toFa(Number(amount).toLocaleString("en-US")) + " ت";
}

const JALALI_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
export function jalaliMonthName(m) {
  return JALALI_MONTHS[(m || 1) - 1] || "";
}
