// services/dailyReportCheckService.js
const { Op, fn, col } = require("sequelize");
const { User, DailyReport, MissedDailyReport } = require("../models");

class DailyReportCheckService {
    static async checkTodayReports() {
        const dayToCheck = new Date();
        dayToCheck.setDate(dayToCheck.getDate() - 1);

        const todayStart = new Date(dayToCheck);
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date(dayToCheck);
        todayEnd.setHours(23, 59, 59, 999);

        // فرمت YYYY-MM-DD برای ذخیره در ستون DATEONLY
        const reportDate = todayStart.toISOString().slice(0, 10);

        const students = await User.findAll({
            where: { role: "student" },
            attributes: ["id", "name", "lastname", "student_number"]
        });

        if (students.length === 0) {
            return { checkedStudents: 0, missedCount: 0, missedUserIds: [] };
        }

        const sentReports = await DailyReport.findAll({
            attributes: [[fn("DISTINCT", col("user_id")), "user_id"]],
            where: {
                report_date: { [Op.between]: [todayStart, todayEnd] }
            },
            raw: true
        });
        const sentUserIds = new Set(sentReports.map((r) => r.user_id));

        const missedStudents = students.filter((student) => !sentUserIds.has(student.id));

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
