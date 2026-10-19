const cron = require("node-cron");
const configs = require("../configs");
const AnalysisExamCheckService = require("../services/analysisExamCheckService");

// طبق درخواست: اول تاریخ برگزاری آزمون رو ادمین مشخص می‌کنه (ExamSchedule)،
// بعد روز بعدش سیستم چک می‌کنه کدوم دانش‌آموزها فرم تحلیل آزمون رو نفرستادن.
const schedule = configs.cron.analysisExamCheck;

if (!cron.validate(schedule)) {
    console.error(`❌ ANALYSIS_EXAM_CHECK_CRON نامعتبره: "${schedule}"`);
} else {
    cron.schedule(schedule, async () => {
        console.log("Running analysis-exam check job...");
        try {
            const result = await AnalysisExamCheckService.checkPendingAnalysisExams();
            console.log(
                `Analysis exam check done: ${result.checkedSchedules} schedule(s) checked, ${result.missedCount} new missed record(s).`
            );
        } catch (error) {
            console.error("Analysis exam check job failed:", error);
        }
    });

    console.log(`Analysis exam check cron job scheduled (schedule: "${schedule}")`);
}

module.exports = schedule;
