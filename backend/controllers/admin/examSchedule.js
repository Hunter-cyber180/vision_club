const moment = require("moment-jalaali");
const { ExamSchedule, MissedAnalysisExam } = require("../../models");

// ادمین تاریخ برگزاری آزمون ماهانه رو ثبت می‌کنه.
// روز بعدش cron/analysisExamCheckJob.js چک می‌کنه کدوم دانش‌آموزها فرم تحلیل آزمون رو نفرستادن.
exports.create = async (request, response) => {
    try {
        const admin = request.user;
        const { title, exam_date } = request.body;

        if (!exam_date)
            return response.status(400).json({ success: false, message: "تاریخ برگزاری آزمون الزامی است" });

        const m = moment(exam_date);

        const examSchedule = await ExamSchedule.create({
            title: title || "آزمون ماهانه",
            exam_date,
            jalali_year: m.jYear(),
            jalali_month: m.jMonth() + 1,
            set_by_admin_id: admin.id,
        });

        return response.status(201).json({
            success: true,
            message: "تاریخ آزمون ماهانه ثبت شد.",
            data: examSchedule
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در ثبت تاریخ آزمون",
            error: error.message
        });
    }
};

exports.getAll = async (request, response) => {
    try {
        const examSchedules = await ExamSchedule.findAll({ order: [["exam_date", "DESC"]] });
        return response.status(200).json({ success: true, data: examSchedules });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت لیست آزمون‌ها",
            error: error.message
        });
    }
};

exports.update = async (request, response) => {
    try {
        const { id } = request.params;
        const { title, exam_date } = request.body;

        const examSchedule = await ExamSchedule.findByPk(id);
        if (!examSchedule)
            return response.status(404).json({ success: false, message: "آزمون یافت نشد!" });

        const updateData = { title: title ?? examSchedule.title };
        if (exam_date) {
            const m = moment(exam_date);
            updateData.exam_date = exam_date;
            updateData.jalali_year = m.jYear();
            updateData.jalali_month = m.jMonth() + 1;
        }

        await examSchedule.update(updateData);

        return response.status(200).json({ success: true, data: examSchedule });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در به‌روزرسانی آزمون",
            error: error.message
        });
    }
};

exports.remove = async (request, response) => {
    try {
        const { id } = request.params;
        const examSchedule = await ExamSchedule.findByPk(id);
        if (!examSchedule)
            return response.status(404).json({ success: false, message: "آزمون یافت نشد!" });

        await MissedAnalysisExam.destroy({ where: { exam_schedule_id: id } });
        await examSchedule.destroy();

        return response.status(200).json({ success: true, message: "آزمون حذف شد." });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در حذف آزمون",
            error: error.message
        });
    }
};
