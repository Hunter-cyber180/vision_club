const { MissedDailyReport, User } = require("../../models");

exports.getAll = async (request, response) => {
    try {
        const { date, resolved } = request.query;

        const where = {};
        if (date) where.report_date = date;
        if (resolved === "true") where.is_resolved = true;
        if (resolved === "false") where.is_resolved = false;

        const userInclude = {
            model: User,
            as: "user",
            attributes: ["id", "name", "lastname", "student_number", "father_number", "mother_number", "telegram_id", "consultant_id"],
        };
        if (request.role === "consultant") {
            userInclude.where = { consultant_id: request.user.id };
            userInclude.required = true;
        }

        const missedReports = await MissedDailyReport.findAll({
            where,
            include: [userInclude],
            order: [["report_date", "DESC"], ["created_at", "DESC"]]
        });

        return response.status(200).json({
            success: true,
            count: missedReports.length,
            data: missedReports
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error getting missed reports",
            error: error.message
        });
    }
};

exports.getCount = async (request, response) => {
    try {
        const { date } = request.query;
        const where = { is_resolved: false };
        if (date) where.report_date = date;

        const options = { where };
        if (request.role === "consultant") {
            options.include = [{ model: User, as: "user", attributes: [], where: { consultant_id: request.user.id }, required: true }];
        }

        const count = await MissedDailyReport.count(options);

        return response.status(200).json({ success: true, count });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error getting missed reports count",
            error: error.message
        });
    }
};

exports.resolve = async (request, response) => {
    try {
        const { id } = request.params;
        const missedReport = await MissedDailyReport.findByPk(id, {
            include: [{ model: User, as: "user", attributes: ["id", "consultant_id"] }],
        });

        if (!missedReport)
            return response.status(404).json({ success: false, message: "Record not found!" });

        if (request.role === "consultant" && (!missedReport.user || missedReport.user.consultant_id !== request.user.id))
            return response.status(403).json({ success: false, message: "این دانش‌آموز مربوط به شما نیست." });

        await missedReport.update({ is_resolved: true, resolved_at: new Date() });

        return response.status(200).json({ success: true, data: missedReport });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error resolving missed report",
            error: error.message
        });
    }
};
