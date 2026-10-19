// services/dailyReportCheckService.js
const { Op, fn, col } = require("sequelize");
const { User, DailyReport, MissedDailyReport } = require("../models");

class DailyReportCheckService {
    /**
     * چک می‌کند کدام دانش‌آموزها گزارش کار "امروز" را نفرستاده‌اند
     * و برای هرکدام یک رکورد در جدول missed_daily_reports ذخیره می‌کند
     * (اگر از قبل برای همان روز ثبت نشده باشد).
     *
     * این تابع توسط cron job هر ۲۴ ساعت یک‌بار صدا زده می‌شود.
     */
    static async checkTodayReports() {
        // این جاب سر نیمه‌شب (00:00) اجرا می‌شه یعنی دقیقاً لحظه‌ای که «امروز» تازه شروع شده.
        // پس چیزی که واقعاً باید چک بشه، ۲۴ ساعتِ روزِ *قبل* هست که تازه تموم شده، نه روزی که همین الان شروع شده.
        const dayToCheck = new Date();
        dayToCheck.setDate(dayToCheck.getDate() - 1);

        const todayStart = new Date(dayToCheck);
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date(dayToCheck);
        todayEnd.setHours(23, 59, 59, 999);

        // فرمت YYYY-MM-DD برای ذخیره در ستون DATEONLY
        const reportDate = todayStart.toISOString().slice(0, 10);

        // ۱. همه دانش‌آموزهای فعال (role = student)
        const students = await User.findAll({
            where: { role: "student" },
            attributes: ["id", "name", "lastname", "student_number"]
        });

        if (students.length === 0) {
            return { checkedStudents: 0, missedCount: 0, missedUserIds: [] };
        }

        // ۲. آی‌دی دانش‌آموزهایی که امروز گزارش فرستاده‌اند
        const sentReports = await DailyReport.findAll({
            attributes: [[fn("DISTINCT", col("user_id")), "user_id"]],
            where: {
                report_date: { [Op.between]: [todayStart, todayEnd] }
            },
            raw: true
        });
        const sentUserIds = new Set(sentReports.map((r) => r.user_id));

        // ۳. دانش‌آموزهایی که گزارش نفرستاده‌اند
        const missedStudents = students.filter((student) => !sentUserIds.has(student.id));

        // ۴. ذخیره نتیجه برای هرکدام (اگر امروز قبلاً ثبت نشده باشد)
        for (const student of missedStudents) {
            await MissedDailyReport.findOrCreate({
                where: { user_id: student.id, report_date: reportDate },
                defaults: { user_id: student.id, report_date: reportDate }
            });
        }

        return {
            checkedStudents: students.length,
            missedCount: missedStudents.length,
            missedUserIds: missedStudents.map((s) => s.id)
        };
    }
}

module.exports = DailyReportCheckService;
