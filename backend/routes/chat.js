const express = require("express");
const controller = require("../controllers/chat");
const validate = require("../middlewares/validate");
const messageSchema = require("../validators/message");
const { authenticateAccessToken } = require("../middlewares/auth");

const router = express.Router();

// چت برای هر سه نقش (کاربر/دانش‌آموز، مشاور، ادمین) یکسانه
router.use(authenticateAccessToken("user", "consultant", "admin"));

router.get("/conversations", controller.getMyConversations);
router.post("/support", controller.startSupportChat);
router.post("/admin-start", controller.startConversationAsAdmin);

router.get("/conversations/:id/messages", controller.getMessages);
router.post("/conversations/:id/messages", validate(messageSchema), controller.sendMessage);

router.patch("/messages/:messageId", controller.editMessage);
router.delete("/messages/:messageId", controller.deleteMessage);
router.post("/messages/:messageId/forward", controller.forwardMessage);

module.exports = router;
