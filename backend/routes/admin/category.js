const express = require("express");
const controller = require("../../controllers/admin/category");
const { authenticateAccessToken } = require("../../middlewares/auth");

const router = express.Router();

router.get("/", controller.getAll);
router.post("/", authenticateAccessToken("admin"), controller.create);
router.put("/:id", authenticateAccessToken("admin"), controller.update);
router.delete("/:id", authenticateAccessToken("admin"), controller.remove);

module.exports = router;
