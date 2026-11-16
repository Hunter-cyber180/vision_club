const cron = require("node-cron");
const configs = require("../configs");
const TuitionPaymentCheckService = require("../services/tuitionPaymentCheckService");

const schedule = configs.cron.tuitionPaymentCheck;

if (!cron.validate(schedule)) {
    console.error(`❌ TUITION_PAYMENT_CHECK_CRON نامعتبره: "${schedule}"`);
} else {
    cron.schedule(schedule, async () => {
        console.log("Running tuition payment status check job...");
        try {
            const result = await TuitionPaymentCheckService.checkCurrentMonthPayments();
            console.log(
                `Tuition payment check done for ${result.jalaliYear}/${result.jalaliMonth}: ` +
                `${result.checkedStudents} student(s) checked, ${result.paidCount} paid, ${result.unpaidCount} unpaid` +
                (result.newUnpaidCount ? `, ${result.newUnpaidCount} new unpaid record(s) created.` : ".")
            );
        } catch (error) {
            console.error("Tuition payment check job failed:", error);
        }
    });

    console.log(`Tuition payment check cron job scheduled (schedule: "${schedule}")`);
}

module.exports = schedule;
