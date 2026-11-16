const express = require("express");
const controller = require("../controllers/support");
const { authenticateAccessToken } = require("../middlewares/auth");

const router = express.Router();

router.get("/", authenticateAccessToken("user", "consultant", "admin"), controller.getSupportInfo);

module.exports = router;
