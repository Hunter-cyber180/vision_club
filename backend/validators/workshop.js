const yup = require("yup");

// yup.url() از یک regex استفاده می‌کنه که فقط دامنه‌هایی با حداقل یک نقطه
// (مثل example.com) رو معتبر می‌دونه؛ آدرس‌های development مثل
// "http://localhost:8080/uploads/..." یا آدرس‌های IP خام رو رد می‌کنه، در
// صورتی که این آدرس‌ها کاملاً معتبرن. برای همین به‌جای yup.url()، از سازنده‌ی
// استاندارد URL خود جاوااسکریپت استفاده می‌کنیم که هر URL مطلق واقعی
// (شامل localhost و IP) رو درست تشخیص می‌ده.
function isValidAbsoluteUrl(value) {
    if (!value) return false;
    try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (_) {
        return false;
    }
}

const workshopSchema = yup.object().shape({
  title: yup
    .string()
    .required("عنوان کارگاه الزامی است")
    .max(100, "عنوان نمی‌تواند بیشتر از 100 کاراکتر باشد")
    .trim(),

  description: yup
    .string()
    .required("توضیحات کارگاه الزامی است")
    .min(10, "توضیحات باید حداقل 10 کاراکتر باشد")
    .trim(),

  duration_minutes: yup
    .number()
    .required("مدت زمان کارگاه الزامی است")
    .positive("مدت زمان باید مثبت باشد")
    .integer("مدت زمان باید عدد صحیح باشد")
    .min(1, "مدت زمان باید حداقل 1 دقیقه باشد"),

  instructor_name: yup
    .string()
    .required("نام مدرس الزامی است")
    .max(100, "نام مدرس نمی‌تواند بیشتر از 100 کاراکتر باشد")
    .trim(),

  video_url: yup
    .string()
    .required("آدرس ویدیو الزامی است")
    .test("is-url", "آدرس ویدیو نامعتبر است", isValidAbsoluteUrl)
    .max(500, "آدرس ویدیو نمی‌تواند بیشتر از 500 کاراکتر باشد")
    .trim(),

  video_thumbnail: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value)) // فیلد خالی = بدون تصویر، نه خطای فرمت
    .test("is-url", "آدرس تصویر نامعتبر است", (value) => !value || isValidAbsoluteUrl(value))
    .max(500, "آدرس تصویر نمی‌تواند بیشتر از 500 کاراکتر باشد")
    .trim(),

  price: yup
    .number()
    .default(0)
    .min(0, "قیمت نمی‌تواند منفی باشد")
    .integer("قیمت باید عدد صحیح باشد"),

  is_active: yup
    .boolean()
    .default(true),

  category_id: yup
    .number()
    .required("شناسه دسته‌بندی الزامی است")
    .positive("شناسه دسته‌بندی باید مثبت باشد")
    .integer("شناسه دسته‌بندی باید عدد صحیح باشد"),
});

module.exports = workshopSchema;
