const { MissedAnalysisExam, User, ExamSchedule } = require("../../models");

// GET /pannel/missed-analysis-exams?examScheduleId=1&resolved=false
// اگر examScheduleId نده، آخرین آزمون تعیین‌شده توسط ادمین در نظر گرفته می‌شود
exports.getAll = async (request, response) => {
    try {
        const { examScheduleId, resolved } = request.query;

        let scheduleId = examScheduleId;
        if (!scheduleId) {
            const latestSchedule = await ExamSchedule.findOne({ order: [["exam_date", "DESC"]] });
            if (!latestSchedule)
                return response.status(200).json({ success: true, count: 0, data: [] });
            scheduleId = latestSchedule.id;
        }

        const where = { exam_schedule_id: scheduleId };
        if (resolved === "true") where.is_resolved = true;
        if (resolved === "false") where.is_resolved = false;

        // یک مشاور فقط باید دانش‌آموزهای خودش رو ببینه؛ فقط ادمین به همه دسترسی داره.
        const userInclude = {
            model: User,
            as: "user",
            attributes: ["id", "name", "lastname", "student_number", "father_number", "mother_number", "telegram_id", "consultant_id"],
        };
        if (request.role === "consultant") {
            userInclude.where = { consultant_id: request.user.id };
            userInclude.required = true;
        }

        const missedRecords = await MissedAnalysisExam.findAll({
            where,
            include: [
                userInclude,
                {
                    model: ExamSchedule,
                    as: "examSchedule"
                }
            ],
            order: [["created_at", "DESC"]]
        });

        return response.status(200).json({
            success: true,
            count: missedRecords.length,
            data: missedRecords
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error getting missed analysis exams",
            error: error.message
        });
    }
};

exports.getCount = async (request, response) => {
    try {
        const { examScheduleId } = request.query;

        let scheduleId = examScheduleId;
        if (!scheduleId) {
            const latestSchedule = await ExamSchedule.findOne({ order: [["exam_date", "DESC"]] });
            if (!latestSchedule)
                return response.status(200).json({ success: true, count: 0 });
            scheduleId = latestSchedule.id;
        }

        const count = await MissedAnalysisExam.count({
            where: { exam_schedule_id: scheduleId, is_resolved: false },
            include: request.role === "consultant"
                ? [{ model: User, as: "user", attributes: [], where: { consultant_id: request.user.id }, required: true }]
                : undefined,
        });

        return response.status(200).json({ success: true, count });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error getting missed analysis exams count",
            error: error.message
        });
    }
};

exports.resolve = async (request, response) => {
    try {
        const { id } = request.params;
        const missedRecord = await MissedAnalysisExam.findByPk(id, {
            include: [{ model: User, as: "user", attributes: ["id", "consultant_id"] }],
        });

        if (!missedRecord)
            return response.status(404).json({ success: false, message: "Record not found!" });

        if (request.role === "consultant" && (!missedRecord.user || missedRecord.user.consultant_id !== request.user.id))
            return response.status(403).json({ success: false, message: "این دانش‌آموز مربوط به شما نیست." });

        await missedRecord.update({ is_resolved: true, resolved_at: new Date() });

        return response.status(200).json({ success: true, data: missedRecord });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error resolving missed analysis exam",
            error: error.message
        });
    }
};
