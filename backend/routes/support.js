const express = require("express");
const controller = require("../controllers/support");
const { authenticateAccessToken } = require("../middlewares/auth");

const router = express.Router();

// اطلاعات پشتیبانی برای هر کاربر لاگین‌کرده‌ای در دسترسه (کاربر/دانش‌آموز/مشاور/ادمین)
router.get("/", authenticateAccessToken("user", "consultant", "admin"), controller.getSupportInfo);

module.exports = router;
