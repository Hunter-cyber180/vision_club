const { Op } = require("sequelize");
const { User, AnalysisExam, ExamSchedule, MissedAnalysisExam } = require("../models");

class AnalysisExamCheckService {
    /**
     * روز بعد از تاریخ برگزاری هر آزمون ماهانه (ExamSchedule)، چک می‌کند
     * کدام دانش‌آموزها فرم "تحلیل آزمون" مربوط به آن آزمون را نفرستاده‌اند
     * و برای هرکدام یک رکورد در missed_analysis_exams ذخیره می‌کند.
     *
     * این تابع توسط cron job صدا زده می‌شود (پیش‌فرض هر ساعت، تا با هر منطقه‌زمانی
     * "روز بعد" شروع بشه، دیر نمونه).
     */
    static async checkPendingAnalysisExams() {
        const now = new Date();
        const todayDateOnly = now.toISOString().slice(0, 10);

        // آزمون‌هایی که تاریخ برگزاریشون گذشته (حداقل یک روز کامل قبل از الان)
        const yesterdayOrEarlier = new Date(now);
        yesterdayOrEarlier.setDate(yesterdayOrEarlier.getDate() - 1);
        const cutoffDate = yesterdayOrEarlier.toISOString().slice(0, 10);

        const examSchedules = await ExamSchedule.findAll({
            where: {
                exam_date: { [Op.lte]: cutoffDate }
            }
        });

        if (examSchedules.length === 0) {
            return { checkedSchedules: 0, missedCount: 0 };
        }

        const students = await User.findAll({
            where: { role: "student" },
            attributes: ["id"]
        });

        let totalMissed = 0;

        for (const examSchedule of examSchedules) {
            // دانش‌آموزهایی که برای این آزمون فرم تحلیل فرستاده‌اند
            const submitted = await AnalysisExam.findAll({
                where: {
                    exam_schedule_id: examSchedule.id,
                },
                attributes: ["user_id"],
                raw: true
            });
            const submittedIds = new Set(submitted.map((s) => s.user_id));

            const missedStudents = students.filter((s) => !submittedIds.has(s.id));

            for (const student of missedStudents) {
                const [, created] = await MissedAnalysisExam.findOrCreate({
                    where: { user_id: student.id, exam_schedule_id: examSchedule.id },
                    defaults: { user_id: student.id, exam_schedule_id: examSchedule.id }
                });
                if (created) totalMissed++;
            }
        }

        return { checkedSchedules: examSchedules.length, missedCount: totalMissed };
    }
}

module.exports = AnalysisExamCheckService;
