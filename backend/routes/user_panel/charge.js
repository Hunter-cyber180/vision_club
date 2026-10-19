const express = require("express");
const controller = require("../../controllers/user_panel/charge");
const { authenticateAccessToken } = require("../../middlewares/auth");

const router = express.Router();

router.post("/set", authenticateAccessToken("admin"), controller.updateCharge);
router.post("/reduce", authenticateAccessToken("user"), controller.reduceCharge);

module.exports = router;
