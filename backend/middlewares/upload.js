const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

/* ============================================================
   سیستم آپلود فایل — یک endpoint عمومی (POST /uploads/:category)
   که بسته به دسته‌ی فایل (image/video/document/archive)، فرمت و
   حجم مجاز رو چک می‌کنه و فایل رو زیر public/uploads/<dir> ذخیره
   می‌کنه. چون public از قبل با express.static سرو می‌شه، فایل بعد
   از آپلود بلافاصله از مسیر /uploads/<dir>/<filename> در دسترسه.
   ============================================================ */

const CATEGORY_CONFIG = {
    image: {
        dir: "images",
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        extensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
        maxSizeMb: 8,
    },
    video: {
        dir: "videos",
        mimeTypes: ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"],
        extensions: [".mp4", ".webm", ".mov", ".mkv"],
        maxSizeMb: 1024, // ۱ گیگابایت
    },
    document: {
        dir: "documents",
        mimeTypes: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        extensions: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"],
        maxSizeMb: 25,
    },
    archive: {
        dir: "archives",
        // فشرده‌سازها خیلی وقت‌ها mimetype درستی از سمت مرورگر نمی‌گیرن (خیلی از
        // مرورگرها برای zip/rar/7z مقدار عمومی application/octet-stream می‌فرستن)،
        // برای همین اعتبارسنجی اصلی روی پسوند فایله، نه mimetype.
        mimeTypes: [
            "application/zip",
            "application/x-zip-compressed",
            "application/x-rar-compressed",
            "application/vnd.rar",
            "application/x-7z-compressed",
            "application/octet-stream",
        ],
        extensions: [".zip", ".rar", ".7z"],
        maxSizeMb: 150,
    },
};

const UPLOAD_ROOT = path.resolve(__dirname, "../public/uploads");

// از قبل مطمئن می‌شیم پوشه‌ی هر دسته وجود داره (وگرنه اولین آپلود با ENOENT شکست می‌خوره)
Object.values(CATEGORY_CONFIG).forEach((cfg) => {
    fs.mkdirSync(path.join(UPLOAD_ROOT, cfg.dir), { recursive: true });
});

function resolveCategory(request) {
    const category = request.params.category;
    return CATEGORY_CONFIG[category] ? category : null;
}

const storage = multer.diskStorage({
    destination: (request, file, cb) => {
        const category = resolveCategory(request);
        if (!category) return cb(new Error("دسته‌ی فایل نامعتبر است."));
        cb(null, path.join(UPLOAD_ROOT, CATEGORY_CONFIG[category].dir));
    },
    filename: (request, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const unique = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
        cb(null, unique);
    },
});

function fileFilter(request, file, cb) {
    const category = resolveCategory(request);
    if (!category) return cb(new Error("دسته‌ی فایل نامعتبر است."));

    const cfg = CATEGORY_CONFIG[category];
    const ext = path.extname(file.originalname).toLowerCase();
    const extOk = cfg.extensions.includes(ext);
    const mimeOk = cfg.mimeTypes.includes(file.mimetype);

    if (!extOk && !mimeOk) {
        return cb(new Error(`فرمت فایل مجاز نیست. فرمت‌های مجاز: ${cfg.extensions.join("، ")}`));
    }
    cb(null, true);
}

// چون سقف حجم بین دسته‌ها فرق داره (ویدیو خیلی بزرگ‌تر از عکسه)، محدودیت اولیه‌ی
// multer روی بزرگ‌ترین سقف ممکنه؛ چک دقیق‌تر بر اساس دسته‌ی واقعی، توی کنترلر انجام می‌شه.
const MAX_POSSIBLE_MB = Math.max(...Object.values(CATEGORY_CONFIG).map((c) => c.maxSizeMb));

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_POSSIBLE_MB * 1024 * 1024 },
});

module.exports = { upload, CATEGORY_CONFIG, UPLOAD_ROOT };
