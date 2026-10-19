const fs = require("fs");
const { CATEGORY_CONFIG } = require("../middlewares/upload");
const configs = require("../configs");

// POST /uploads/:category  (multipart/form-data, field name: "file")
exports.uploadFile = async (request, response) => {
    try {
        if (!request.file) {
            return response.status(400).json({ success: false, message: "فایلی ارسال نشده است." });
        }

        const category = request.params.category;
        const cfg = CATEGORY_CONFIG[category];
        const maxBytes = cfg.maxSizeMb * 1024 * 1024;

        if (request.file.size > maxBytes) {
            fs.unlink(request.file.path, () => {});
            return response.status(400).json({
                success: false,
                message: `حجم فایل بیشتر از حد مجاز (${cfg.maxSizeMb} مگابایت) برای این نوع فایل است.`,
            });
        }

        // فرم افزودن/ویرایش کارگاه، آدرس ویدیو/تصویر رو با yup().url() اعتبارسنجی
        // می‌کنه که فقط URL مطلق (با http/https) رو قبول می‌کنه؛ یه مسیر نسبی مثل
        // "/uploads/videos/x.mp4" رد می‌شه و پیام "آدرس ویدیو نامعتبر است" می‌ده.
        // برای همین همیشه URL کامل (با دامنه‌ی بک‌اند) برمی‌گردونیم.
        const base = configs.backendBaseUrl || `${request.protocol}://${request.get("host")}`;
        const publicUrl = `${base}/uploads/${cfg.dir}/${request.file.filename}`;

        return response.status(201).json({
            success: true,
            data: {
                url: publicUrl,
                filename: request.file.originalname,
                storedName: request.file.filename,
                mimetype: request.file.mimetype,
                size: request.file.size,
                category,
            },
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "آپلود فایل ناموفق بود.",
            error: error.message,
        });
    }
};
