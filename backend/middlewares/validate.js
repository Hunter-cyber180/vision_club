module.exports = (validator) => {
  return async (req, res, next) => {
    try {
      // نکته‌ی مهم: نتیجه‌ی validate() باید جایگزین req.body بشه، چون شامل
      // مقادیر transform‌شده هم هست (مثلاً .lowercase()/.trim() روی ایمیل).
      req.body = await validator.validate(req.body, {
        abortEarly: false,
      });
    } catch (err) {
      // نکته‌ی خیلی مهم: قبلاً اینجا { errors: ... } برمی‌گشت، ولی توی کل
      // فرانت همه‌جا دنبال err.data.message می‌گرده (چون بقیه‌ی خطاهای
      // بک‌اند همیشه با کلید message برمی‌گردن). یعنی هر خطای اعتبارسنجی
      // (فیلد خالی، فرمت غلط، و...) در عمل هیچ‌وقت پیام واقعیش به کاربر
      // نشون داده نمی‌شد — فقط پیام fallback عمومی («ذخیره ناموفق بود»)
      // دیده می‌شد. الان با ساختار یکسان با بقیه‌ی خطاهای بک‌اند برمی‌گرده.
      return res.status(400).json({ success: false, message: err.errors[0] });
    }

    next();
  };
};
