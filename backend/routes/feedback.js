const express = require("express");
const controller = require("../controllers/feedback");
const { authenticateAccessToken } = require("../middlewares/auth");

const router = express.Router();

// فقط مشاور و ادمین بازخورد می‌نویسن؛ دانش‌آموز بازخوردها رو توی لیست گزارش‌ها/تحلیل‌های خودش (feedbacks) می‌بینه.
router.use(authenticateAccessToken("consultant", "admin"));

router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
