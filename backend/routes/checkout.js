const express = require("express");
const controller = require("../controllers/checkout");
const { authenticateAccessToken } = require("../middlewares/auth");

const router = express.Router();

router.post("/", authenticateAccessToken("user"), controller.createCheckout);
router.get("/verify", controller.verifyCheckout);

module.exports = router;
