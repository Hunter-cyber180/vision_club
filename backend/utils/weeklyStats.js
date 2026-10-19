const moment = require("moment-jalaali");
const { Op } = require("sequelize");
const {
    DailyReport: DailyReportModel,
    DailyReportLesson,
    AnalysisExam: AnalysisExamModel,
} = require("../models");

const WEEKDAY_LABELS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

/**
 * آمار هفته‌ی اخیر (۷ روز گذشته تا امروز) یک دانش‌آموز، برای سه نمودار:
 *  - روند تراز آزمون‌ها (از AnalysisExam.standard_score، بر اساس test_date)
 *  - حجم تست/تشریحی روزانه (جمع DailyReportLesson.test_count/essay_count به تفکیک روز)
 *  - حجم مطالعه‌ی روزانه به دقیقه (جمع DailyReportLesson.study_minutes به تفکیک روز)
 * هر سه بر اساس همین بازه‌ی یک‌هفته‌ای محاسبه می‌شن.
 */
async function computeWeeklyStats(userId) {
    const today = moment().startOf("day");
    const weekStart = moment(today).subtract(6, "days");

    const rangeStart = weekStart.toDate();
    const rangeEnd = moment(today).endOf("day").toDate();

    const [reports, analyses] = await Promise.all([
        DailyReportModel.findAll({
            where: { user_id: userId, report_date: { [Op.between]: [rangeStart, rangeEnd] } },
            include: [{ model: DailyReportLesson, as: "lessons" }],
            order: [["report_date", "ASC"]],
        }),
        AnalysisExamModel.findAll({
            where: { user_id: userId, test_date: { [Op.between]: [rangeStart, rangeEnd] } },
            order: [["test_date", "ASC"]],
        }),
    ]);

    // یک ردیف پایه برای هر ۷ روز (حتی روزهایی که گزارشی نبوده، صفر نشون داده بشه)
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = moment(weekStart).add(i, "days");
        days.push({
            date: d.format("YYYY-MM-DD"),
            jalali: d.format("jYYYY/jMM/jDD"),
            weekday: WEEKDAY_LABELS[d.day()],
            test_count: 0,
            essay_count: 0,
            study_minutes: 0,
        });
    }
    const byDate = new Map(days.map((d) => [d.date, d]));

    for (const report of reports) {
        const key = moment(report.report_date).format("YYYY-MM-DD");
        const bucket = byDate.get(key);
        if (!bucket) continue;
        for (const lesson of report.lessons || []) {
            // درسی که وضعیتش «انجام‌نشده» ثبت شده رو توی نمودارها حساب نکن —
            // چون واقعاً کاری روش انجام نشده، نباید توی حجم تست/تشریحی یا
            // مطالعه‌ی اون روز جمع بشه (even اگه به‌اشتباه عددی توش وارد شده باشه).
            if (lesson.activity_type === "not_done") continue;
            bucket.test_count += lesson.test_count || 0;
            bucket.essay_count += lesson.essay_count || 0;
            bucket.study_minutes += lesson.study_minutes || 0;
        }
    }

    const examTrend = analyses.map((a) => ({
        date: moment(a.test_date).format("YYYY-MM-DD"),
        jalali: moment(a.test_date).format("jYYYY/jMM/jDD"),
        name: a.name,
        standard_score: a.standard_score,
        rank: a.rank,
    }));

    return { days, examTrend };
}

module.exports = { computeWeeklyStats };
