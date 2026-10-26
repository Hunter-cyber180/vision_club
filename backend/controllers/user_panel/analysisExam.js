const { attachFeedbacks } = require("../../utils/feedbacks");
const { AnalysisExam, AnalysisExamLesson, MissedAnalysisExam, ExamSchedule, User, Op } = require("../../models");

// دانش‌آموز فرم تحلیل آزمون رو ثبت می‌کنه (همراه با ریز نمرات دروس - اختیاری)
exports.create = async (request, response) => {
    try {
        const user = request.user; // authenticateAccessToken("user")
        const {
            name,
            organizer,
            test_date,
            rank,
            standard_score,
            weak_points,
            notes,
            exam_schedule_id,
            lessons // آرایه‌ی اختیاری: [{ subject, test_count, correct_count, wrong_minutes }]
        } = request.body;

        if (!name || !organizer || !test_date)
            return response.status(400).json({
                success: false,
                message: "نام آزمون، برگزارکننده و تاریخ آزمون الزامی است"
            });

        const analysisExam = await AnalysisExam.create({
            user_id: user.id,
            consultant_id: user.consultant_id || null,
            exam_schedule_id: exam_schedule_id || null,
            name,
            organizer,
            test_date,
            rank,
            standard_score,
            weak_points,
            notes,
        });

        if (Array.isArray(lessons) && lessons.length > 0) {
            await AnalysisExamLesson.bulkCreate(
                lessons.map((l) => ({
                    analysis_id: analysisExam.id,
                    subject: l.subject,
                    test_count: l.test_count || 0,
                    correct_count: l.correct_count || 0,
                    wrong_minutes: l.wrong_minutes || 0,
                }))
            );
        }

        // اگر این فرم مربوط به یک آزمون ماهانه‌ی تعیین‌شده توسط ادمین بود،
        // رکورد "فراموش‌شده" (در صورت وجود) رو resolve کن
        if (exam_schedule_id) {
            await MissedAnalysisExam.update(
                { is_resolved: true, resolved_at: new Date() },
                { where: { user_id: user.id, exam_schedule_id, is_resolved: false } }
            );
        }

        const fullRecord = await AnalysisExam.findByPk(analysisExam.id, {
            include: [{ model: AnalysisExamLesson, as: "lessons" }]
        });

        return response.status(201).json({
            success: true,
            message: "فرم تحلیل آزمون با موفقیت ثبت شد.",
            data: fullRecord
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در ثبت فرم تحلیل آزمون",
            error: error.message
        });
    }
};

exports.getMine = async (request, response) => {
    try {
        const user = request.user;
        const analysisExams = await AnalysisExam.findAll({
            where: { user_id: user.id },
            include: [{ model: AnalysisExamLesson, as: "lessons" }],
            order: [["test_date", "DESC"]]
        });

        return response.status(200).json({ success: true, data: await attachFeedbacks(analysisExams, "analysis_exam") });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت فرم‌های تحلیل آزمون",
            error: error.message
        });
    }
};

exports.getOne = async (request, response) => {
    try {
        const { id } = request.params;
        const analysisExam = await AnalysisExam.findByPk(id, {
            include: [
                { model: AnalysisExamLesson, as: "lessons" },
                { model: User, as: "user", attributes: ["id", "name", "lastname", "student_number"] }
            ]
        });

        if (!analysisExam)
            return response.status(404).json({ success: false, message: "فرم تحلیل آزمون یافت نشد!" });

        return response.status(200).json({ success: true, data: analysisExam });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت فرم تحلیل آزمون",
            error: error.message
        });
    }
};
