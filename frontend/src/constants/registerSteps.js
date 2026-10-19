// این فیلدها دقیقاً منطبق با backend/validators/register.js و
// backend/validators/consultantRegister.js هستن (هیچ فیلدی کم یا اضافه نشده).

export const USER_REGISTER_STEPS = [
  {
    title: "اطلاعات هویتی",
    subtitle: "مشخصات اصلی دانش‌آموز",
    fields: [
      { id: "name", label: "نام", type: "text", placeholder: "مثلاً علی" },
      { id: "lastname", label: "نام‌خانوادگی", type: "text", placeholder: "مثلاً محمدی" },
      { id: "birthday", label: "تاریخ تولد", type: "date" },
      { id: "gender", label: "جنسیت", type: "select", options: [{ value: "male", label: "پسر" }, { value: "female", label: "دختر" }] },
    ],
  },
  {
    title: "تماس و شهر",
    subtitle: "برای هماهنگی و تعیین سطح مشاوره",
    fields: [
      { id: "email", label: "ایمیل", type: "email", placeholder: "you@example.com" },
      { id: "city", label: "شهر", type: "text", placeholder: "مثلاً تهران" },
      { id: "student_number", label: "شماره موبایل خودت", type: "tel", placeholder: "۰۹xxxxxxxxx" },
      { id: "father_number", label: "شماره تلفن پدر", type: "tel", placeholder: "۰۹xxxxxxxxx" },
      { id: "mother_number", label: "شماره تلفن مادر", type: "tel", placeholder: "۰۹xxxxxxxxx", optional: true },
      { id: "telegram_id", label: "آیدی تلگرام", type: "text", placeholder: "@username", optional: true },
    ],
  },
  {
    title: "وضعیت تحصیلی",
    subtitle: "برای برنامه‌ریزی دقیق‌تر مسیر شما",
    fields: [
      { id: "degree", label: "پایه/مدرک تحصیلی", type: "text", placeholder: "مثلاً دوازدهم تجربی" },
      { id: "grade_10_gpa", label: "معدل دهم", type: "number", placeholder: "از ۲۰", optional: true },
      { id: "grade_11_gpa", label: "معدل یازدهم", type: "number", placeholder: "از ۲۰", optional: true },
      { id: "grade_12_gpa", label: "معدل دوازدهم", type: "number", placeholder: "از ۲۰", optional: true },
    ],
  },
  {
    title: "سوابق و اهداف کنکور",
    subtitle: "برای برنامه‌ریزی دقیق‌تر مسیر شما",
    fields: [
      { id: "is_retaker", label: "آیا پشت‌کنکوری هستید؟", type: "select", options: [{ value: "false", label: "خیر" }, { value: "true", label: "بله" }] },
      { id: "entrance_exam_attempts", label: "تعداد دفعات شرکت در کنکور", type: "number", placeholder: "0" },
      { id: "prev_national_rank", label: "رتبه کنکور قبلی", type: "number", placeholder: "در صورت وجود", optional: true },
      { id: "preferred_major", label: "رشته مورد علاقه برای ادامه تحصیل", type: "text", placeholder: "مثلاً پزشکی، مهندسی کامپیوتر..." },
      { id: "preferred_universities", label: "دانشگاه‌های مورد نظر", type: "text", placeholder: "اختیاری", optional: true },
      { id: "notes", label: "نگرانی یا نکات خاص", type: "textarea", placeholder: "اگر نکته‌ی خاصی هست همین‌جا بنویس...", optional: true },
    ],
  },
  {
    title: "رمز عبور",
    subtitle: "آخرین قدم قبل از شروع",
    fields: [
      { id: "user_password", label: "رمز عبور", type: "password", placeholder: "حداقل ۸ کاراکتر" },
      { id: "confirmPassword", label: "تکرار رمز عبور", type: "password", placeholder: "رمز عبور رو دوباره وارد کن" },
    ],
  },
];

export const CONSULTANT_REGISTER_STEPS = [
  {
    title: "هویت و تماس",
    subtitle: "مشخصات اصلی مشاور",
    fields: [
      { id: "name", label: "نام", type: "text", placeholder: "مثلاً رضا" },
      { id: "lastname", label: "نام‌خانوادگی", type: "text", placeholder: "مثلاً محمدی" },
      { id: "email", label: "ایمیل", type: "email", placeholder: "you@example.com" },
      { id: "phone_number", label: "شماره تلفن", type: "tel", placeholder: "۰۹xxxxxxxxx" },
      { id: "telegram_id", label: "آیدی تلگرام", type: "text", placeholder: "@username", optional: true },
    ],
  },
  {
    title: "تخصص مشاوره",
    subtitle: "برای معرفی شما به دانش‌آموزان",
    fields: [
      { id: "counseling_fields", label: "رشته‌های تحت مشاوره", type: "checkbox-group", options: ["انسانی", "ریاضی", "تجربی"] },
      { id: "consultation_type", label: "نوع مشاوره", type: "select", options: [{ value: "individual", label: "فردی" }, { value: "group", label: "گروهی" }, { value: "both", label: "هردو" }] },
      { id: "experience_years", label: "سابقه مشاوره (سال)", type: "number", placeholder: "0" },
      { id: "education", label: "تحصیلات", type: "text", placeholder: "مثلاً کارشناسی ارشد روان‌شناسی", optional: true },
    ],
  },
  {
    title: "بیوگرافی و مهارت‌ها",
    subtitle: "برای شناخت بهتر شما",
    fields: [
      { id: "skills", label: "مهارت‌ها", type: "textarea", placeholder: "مثلاً برنامه‌ریزی درسی، مدیریت استرس...", optional: true },
      { id: "bio", label: "بیوگرافی", type: "textarea", placeholder: "چند خط درباره خودت و سبک مشاوره‌ات...", optional: true },
    ],
  },
  {
    title: "رمز عبور",
    subtitle: "آخرین قدم قبل از ثبت درخواست",
    fields: [
      { id: "consultant_password", label: "رمز عبور", type: "password", placeholder: "حداقل ۸ کاراکتر" },
      { id: "confirmPassword", label: "تکرار رمز عبور", type: "password", placeholder: "رمز عبور رو دوباره وارد کن" },
    ],
  },
];
