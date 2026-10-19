const express = require("express");
const controller = require("../../controllers/user_panel/cart");
const { authenticateAccessToken } = require("../../middlewares/auth");

const router = express.Router();

router.get("/", authenticateAccessToken("user"), controller.getCart);
router.post("/", authenticateAccessToken("user"), controller.addToCart);
router.delete("/:id", authenticateAccessToken("user"), controller.removeFromCart);
router.post("/checkout", authenticateAccessToken("user"), controller.checkout);

module.exports = router;
