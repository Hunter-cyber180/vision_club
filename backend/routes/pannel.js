const express = require("express");
const router = express.Router();

const missedDailyReportController = require("../controllers/consultant/missedDailyReport");
const missedAnalysisExamController = require("../controllers/consultant/missedAnalysisExam");
const { authenticateAccessToken } = require("../middlewares/auth");

// فقط مشاور و ادمین به این نتایج دسترسی دارن

// گزارش کار روزانه (چک هر ۲۴ ساعت)
router.get(
    "/missed-reports",
    authenticateAccessToken("consultant", "admin"),
    missedDailyReportController.getAll
);

router.get(
    "/missed-reports/count",
    authenticateAccessToken("consultant", "admin"),
    missedDailyReportController.getCount
);

router.patch(
    "/missed-reports/:id/resolve",
    authenticateAccessToken("consultant", "admin"),
    missedDailyReportController.resolve
);

// فرم تحلیل آزمون ماهانه (چک روز بعد از آزمون)
router.get(
    "/missed-analysis-exams",
    authenticateAccessToken("consultant", "admin"),
    missedAnalysisExamController.getAll
);

router.get(
    "/missed-analysis-exams/count",
    authenticateAccessToken("consultant", "admin"),
    missedAnalysisExamController.getCount
);

router.patch(
    "/missed-analysis-exams/:id/resolve",
    authenticateAccessToken("consultant", "admin"),
    missedAnalysisExamController.resolve
);

module.exports = router;
