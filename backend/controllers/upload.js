const fs = require("fs");
const { CATEGORY_CONFIG } = require("../middlewares/upload");
const configs = require("../configs");

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
