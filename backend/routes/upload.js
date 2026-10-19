const express = require("express");
const { upload, CATEGORY_CONFIG } = require("../middlewares/upload");
const controller = require("../controllers/upload");
const { authenticateAccessToken } = require("../middlewares/auth");

const router = express.Router();

// هر سه نقش (دانش‌آموز، مشاور، ادمین) اجازه‌ی آپلود دارن — محدودیت واقعی
// (اینکه کدوم فرم کدوم دسته‌فایل رو قبول می‌کنه) سمت فرانت اعمال می‌شه.
router.post(
    "/:category",
    authenticateAccessToken("user", "consultant", "admin"),
    (request, response, next) => {
        if (!CATEGORY_CONFIG[request.params.category]) {
            return response.status(400).json({ success: false, message: "دسته‌ی فایل نامعتبر است." });
        }
        upload.single("file")(request, response, (err) => {
            if (err) {
                let message = err.message || "آپلود فایل ناموفق بود.";
                if (err.code === "LIMIT_FILE_SIZE") message = "حجم فایل بیشتر از حد مجاز است.";
                return response.status(400).json({ success: false, message });
            }
            next();
        });
    },
    controller.uploadFile
);

module.exports = router;
