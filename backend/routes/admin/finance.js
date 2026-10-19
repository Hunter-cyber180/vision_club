const express = require("express");
const controller = require("../../controllers/admin/finance");
const { authenticateAccessToken } = require("../../middlewares/auth");

const router = express.Router();

router.use(authenticateAccessToken("admin"));

router.get("/summary", controller.getSummary);
router.get("/transactions", controller.getTransactions);
router.get("/monthly", controller.getMonthlyRevenue);
router.get("/unpaid-students", controller.getUnpaidStudents);

module.exports = router;
