const cron = require("node-cron");
const DailyReportCheckService = require("../services/dailyReportCheckService");

// ساعت اجرای چک روزانه از .env خونده میشه، پیش‌فرض هر شب نیمه‌شب (00:00)
// فرمت cron: "دقیقه ساعت روزماه ماه روزهفته"
// مثال‌ها:
//   "0 21 * * *"  -> هر روز ساعت 21:00
//   "30 23 * * *" -> هر روز ساعت 23:30
//   "0 8 * * *"   -> هر روز ساعت 08:00
const configs = require("../configs");
const schedule = configs.cron.dailyReportCheck;

if (!cron.validate(schedule)) {
    console.error(
        `❌ DAILY_REPORT_CHECK_CRON نامعتبره: "${schedule}". از فرمت cron مثل "0 21 * * *" استفاده کن.`
    );
} else {
    cron.schedule(schedule, async () => {
        console.log("Running daily report check job...");
        try {
            const result = await DailyReportCheckService.checkTodayReports();
            console.log(
                `Daily report check done: ${result.missedCount} of ${result.checkedStudents} student(s) haven't sent today's report.`
            );
        } catch (error) {
            console.error("Daily report check job failed:", error);
        }
    });

    console.log(`Daily report check cron job scheduled (schedule: "${schedule}")`);
}

module.exports = schedule;
