// services/tuitionPaymentCheckService.js
const moment = require("moment-jalaali");
const { User, TuitionPayment } = require("../models");

class TuitionPaymentCheckService {
    /**
     * برای «ماه شمسی جاری»، وضعیت شهریه‌ی همه‌ی دانش‌آموزهایی که به یک
     * مشاور متصل هستن رو بررسی می‌کنه:
     *   - اگر دانش‌آموزی برای این ماه اصلاً رکورد شهریه نداره (مثلاً همین
     *     امروز به یک مشاور وصل شده)، یک رکورد "unpaid" براش می‌سازه تا
     *     از همون لحظه در لیست «پرداخت‌نشده‌ها»ی مشاور دیده بشه.
     *   - برای رکوردهایی که از قبل هست (چه paid چه unpaid) کاری نمی‌کنه —
     *     چون تغییر وضعیت به paid فقط با پرداخت واقعی (درگاه) یا ثبت دستی
     *     مشاور/ادمین اتفاق می‌افته، نه با این چک خودکار.
     *
     * این تابع هر ۳۰ دقیقه یک‌بار توسط cron صدا زده می‌شه (پیکربندی:
     * configs.cron.tuitionPaymentCheck) تا در طول ماه، وضعیت پرداخت‌ها
     * همیشه به‌روز و قابل‌مشاهده برای مشاور/ادمین باشه؛ مشابه همون الگویی
     * که برای چک گزارش‌کار روزانه و تحلیل آزمون استفاده شده.
     */
    static async checkCurrentMonthPayments() {
        const now = moment();
        const jalaliYear = now.jYear();
        const jalaliMonth = now.jMonth() + 1; // moment-jalaali از 0 شروع می‌شه

        const students = await User.findAll({
            where: { role: "student" },
            attributes: ["id", "consultant_id"],
        });

        const studentsWithConsultant = students.filter((s) => !!s.consultant_id);

        if (studentsWithConsultant.length === 0) {
            return { checkedStudents: 0, jalaliYear, jalaliMonth, newUnpaidCount: 0, paidCount: 0, unpaidCount: 0 };
        }

        let newUnpaidCount = 0;
        for (const student of studentsWithConsultant) {
            const [, created] = await TuitionPayment.findOrCreate({
                where: {
                    user_id: student.id,
                    jalali_year: jalaliYear,
                    jalali_month: jalaliMonth,
                },
                defaults: {
                    user_id: student.id,
                    consultant_id: student.consultant_id,
                    jalali_year: jalaliYear,
                    jalali_month: jalaliMonth,
                    status: "unpaid",
                },
            });
            if (created) newUnpaidCount++;
        }

        const records = await TuitionPayment.findAll({
            where: {
                jalali_year: jalaliYear,
                jalali_month: jalaliMonth,
                user_id: studentsWithConsultant.map((s) => s.id),
            },
            attributes: ["status"],
            raw: true,
        });
        const paidCount = records.filter((r) => r.status === "paid").length;
        const unpaidCount = records.filter((r) => r.status === "unpaid").length;

        return {
            checkedStudents: studentsWithConsultant.length,
            jalaliYear,
            jalaliMonth,
            newUnpaidCount,
            paidCount,
            unpaidCount,
        };
    }
}

module.exports = TuitionPaymentCheckService;
