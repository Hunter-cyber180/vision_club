const express = require("express");
const controller = require("../controllers/checkout");
const { authenticateAccessToken } = require("../middlewares/auth");

const router = express.Router();

router.post("/", authenticateAccessToken("user"), controller.createCheckout);
// زرین‌پال بعد از پرداخت با GET ریدایرکت می‌کنه (بدون هدر Authorization)، پس این روت نباید نیاز به توکن داشته باشه
router.get("/verify", controller.verifyCheckout);

module.exports = router;
