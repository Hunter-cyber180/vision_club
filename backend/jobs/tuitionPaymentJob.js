const cron = require("node-cron");
const moment = require("moment-jalaali");
const configs = require("../configs");
const { User, TuitionPayment } = require("../models");

// هر روز رأس ساعت مشخص‌شده در .env (پیش‌فرض 00:10) اجرا می‌شود.
// برای ماه شمسی جاری، اگر دانش‌آموزی هنوز رکورد شهریه نداشته باشد،
// یک رکورد با وضعیت "unpaid" ساخته می‌شود تا بتوان بررسی کرد شهریه پرداخت شده یا نه.
const schedule = configs.cron.tuitionPayment;

if (!cron.validate(schedule)) {
    console.error(`❌ TUITION_PAYMENT_CRON نامعتبره: "${schedule}"`);
} else {
    cron.schedule(schedule, async () => {
        console.log("Running tuition payment check job...");
        try {
            const now = moment();
            const jalaliYear = now.jYear();
            const jalaliMonth = now.jMonth() + 1; // moment-jalaali از 0 شروع می‌شود

            const students = await User.findAll({ where: { role: "student" } });

            let createdCount = 0;
            for (const student of students) {
                const [, created] = await TuitionPayment.findOrCreate({
                    where: {
                        user_id: student.id,
                        jalali_year: jalaliYear,
                        jalali_month: jalaliMonth
                    },
                    defaults: {
                        user_id: student.id,
                        consultant_id: student.consultant_id,
                        jalali_year: jalaliYear,
                        jalali_month: jalaliMonth,
                        status: "unpaid"
                    }
                });
                if (created) createdCount++;
            }

            console.log(`Tuition payment records ensured for ${jalaliYear}/${jalaliMonth} (${students.length} students checked, ${createdCount} new unpaid records)`);
        } catch (error) {
            console.error("Tuition payment job failed:", error);
        }
    });

    console.log(`Tuition payment cron job scheduled (schedule: "${schedule}")`);
}

module.exports = schedule;
