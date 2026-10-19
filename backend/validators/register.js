const yup = require("yup");
const phoneRegex = /^[0-9]{10,15}$/;

const userSchema = yup.object().shape({
  // اطلاعات اصلی
  name: yup
    .string()
    .max(100, "نام نباید بیشتر از ۱۰۰ کاراکتر باشد")
    .required("نام الزامی است")
    .trim(),

  lastname: yup
    .string()
    .max(100, "نام خانوادگی نباید بیشتر از ۱۰۰ کاراکتر باشد")
    .required("نام خانوادگی الزامی است")
    .trim(),

  user_password: yup
    .string()
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
    .max(50, "رمز عبور نباید بیشتر از ۵۰ کاراکتر باشد")
    .required("رمز عبور الزامی است"),

  confirmPassword: yup
    .string()
    .oneOf([yup.ref("user_password")], "رمز عبور و تأیید آن مطابقت ندارند")
    .required("تأیید رمز عبور الزامی است"),

  email: yup
    .string()
    .email("فرمت ایمیل نامعتبر است")
    .max(100, "ایمیل نباید بیشتر از ۱۰۰ کاراکتر باشد")
    .required("ایمیل الزامی است")
    .lowercase() // ؟؟؟؟؟؟
    .trim(),

  birthday: yup
    .date()
    .typeError("تاریخ تولد معتبر نیست")
    .required("تاریخ تولد الزامی است")
    .max(new Date(), "تاریخ تولد نمی‌تواند در آینده باشد"),

  gender: yup
    .string()
    .oneOf(["male", "female"], "جنسیت باید male یا female باشد")
    .required("جنسیت الزامی است"),

  city: yup
    .string()
    .max(100, "شهر نباید بیشتر از ۱۰۰ کاراکتر باشد")
    .required("شهر الزامی است")
    .trim(),

  student_number: yup
    .string()
    .matches(phoneRegex, "شماره تلفن دانشجو باید بین ۱۰ تا ۱۵ رقم باشد")
    .max(15, "شماره تلفن دانشجو نباید بیشتر از ۱۵ رقم باشد")
    .required("شماره دانشجویی الزامی است")
    .trim(),

  father_number: yup
    .string()
    .matches(phoneRegex, "شماره تلفن پدر باید بین ۱۰ تا ۱۵ رقم باشد")
    .max(15, "شماره تلفن پدر نباید بیشتر از ۱۵ رقم باشد")
    .required("شماره تلفن پدر الزامی است")
    .trim(),

  mother_number: yup
    .string()
    .nullable()
    .matches(phoneRegex, "شماره تلفن مادر باید بین ۱۰ تا ۱۵ رقم باشد")
    .max(15, "شماره تلفن مادر نباید بیشتر از ۱۵ رقم باشد")
    .trim(),

  telegram_id: yup
    .string()
    .nullable()
    .max(100, "آیدی تلگرام نباید بیشتر از ۱۰۰ کاراکتر باشد")
    .trim(),

  degree: yup
    .string()
    .max(50, "مدرک تحصیلی نباید بیشتر از ۵۰ کاراکتر باشد")
    .required("مدرک تحصیلی الزامی است")
    .trim(),

  // معدل‌ها (اختیاری با اعتبارسنجی محدوده)
  grade_10_gpa: yup
    .number()
    .nullable()
    .typeError("معدل سال دهم باید عدد باشد")
    .min(0, "معدل سال دهم نباید کمتر از ۰ باشد")
    .max(20, "معدل سال دهم نباید بیشتر از ۲۰ باشد")
    .test(
      "is-decimal",
      "معدل سال دهم حداکثر ۲ رقم اعشار می‌تواند داشته باشد",
      (value) => {
        if (value === null || value === undefined) return true;
        const str = value.toString();
        const decimalPart = str.split(".")[1];
        return !decimalPart || decimalPart.length <= 2;
      }
    ),

  grade_11_gpa: yup
    .number()
    .nullable()
    .typeError("معدل سال یازدهم باید عدد باشد")
    .min(0, "معدل سال یازدهم نباید کمتر از ۰ باشد")
    .max(20, "معدل سال یازدهم نباید بیشتر از ۲۰ باشد")
    .test(
      "is-decimal",
      "معدل سال یازدهم حداکثر ۲ رقم اعشار می‌تواند داشته باشد",
      (value) => {
        if (value === null || value === undefined) return true;
        const str = value.toString();
        const decimalPart = str.split(".")[1];
        return !decimalPart || decimalPart.length <= 2;
      }
    ),

  grade_12_gpa: yup
    .number()
    .nullable()
    .typeError("معدل سال دوازدهم باید عدد باشد")
    .min(0, "معدل سال دوازدهم نباید کمتر از ۰ باشد")
    .max(20, "معدل سال دوازدهم نباید بیشتر از ۲۰ باشد")
    .test(
      "is-decimal",
      "معدل سال دوازدهم حداکثر ۲ رقم اعشار می‌تواند داشته باشد",
      (value) => {
        if (value === null || value === undefined) return true;
        const str = value.toString();
        const decimalPart = str.split(".")[1];
        return !decimalPart || decimalPart.length <= 2;
      }
    ),

  // سایر فیلدها
  is_retaker: yup
    .boolean()
    .typeError("وضعیت تکراری بودن باید true یا false باشد")
    .default(false)
    .required(),

  entrance_exam_attempts: yup
    .number()
    .integer("تعداد دفعات کنکور باید عدد صحیح باشد")
    .min(0, "تعداد دفعات کنکور نمی‌تواند منفی باشد")
    .default(0)
    .required(),

  prev_national_rank: yup
    .number()
    .nullable()
    .integer("رتبه قبلی باید عدد صحیح باشد")
    .typeError("رتبه قبلی باید عدد باشد"),

  preferred_major: yup
    .string()
    .max(200, "رشته مورد علاقه نباید بیشتر از ۲۰۰ کاراکتر باشد")
    .required("رشته مورد علاقه الزامی است")
    .trim(),

  preferred_universities: yup
    .string()
    .nullable()
    .max(150, "متن دانشگاه‌های مورد نظر طولانی است")
    .trim(),

  notes: yup
    .string()
    .nullable()
    .max(65535, "یادداشت‌ها طولانی است")
    .trim(),
});

// برای اعتبارسنجی به‌روزرسانی (بدون فیلدهای الزامی)
const updateUserSchema = userSchema.shape({
  // فیلدهایی که در به‌روزرسانی می‌توانند اختیاری باشند
  name: yup.string().max(100).optional().trim(),
  lastname: yup.string().max(100).optional().trim(),
  user_password: yup.string().min(8).max(50).optional(),
  email: yup.string().email().max(100).optional().lowercase().trim(),
  birthday: yup.date().typeError("تاریخ تولد معتبر نیست").optional(),
  gender: yup.string().oneOf(["male", "female"]).optional(),
  city: yup.string().max(100).optional().trim(),
  student_number: yup.string().matches(phoneRegex).max(50).optional().trim(),
  father_number: yup.string().matches(phoneRegex).max(15).optional().trim(),
  degree: yup.string().max(50).optional().trim(),
  preferred_major: yup.string().max(200).optional().trim(),
  
  // حذف confirmPassword از اسکمای به‌روزرسانی
  confirmPassword: yup.mixed().notRequired(),
}).optional();

module.exports = userSchema
