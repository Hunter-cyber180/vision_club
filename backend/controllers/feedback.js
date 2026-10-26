const { ReportFeedback, DailyReport, AnalysisExam, User } = require("../models");

const TARGET_MODELS = { daily_report: DailyReport, analysis_exam: AnalysisExam };
const MAX_LEN = 3000;

function authorName(request) {
    if (request.role === "consultant") return `${request.user.name} ${request.user.lastname}`.trim();
    return "ادمین";
}

// مشاور فقط روی گزارش/تحلیل دانش‌آموزهای خودش می‌تونه بازخورد بده؛ ادمین روی همه.
async function canAccessStudent(request, studentId) {
    if (request.role === "admin") return true;
    const student = await User.findByPk(studentId);
    return !!student && student.consultant_id === request.user.id;
}

// POST /feedbacks  { target_type, target_id, text }
exports.create = async (request, response) => {
    try {
        const { target_type, target_id } = request.body;
        const text = (request.body.text || "").trim();

        const Target = TARGET_MODELS[target_type];
        if (!Target || !target_id)
            return response.status(400).json({ success: false, message: "نوع یا شناسه‌ی مورد بازخورد نامعتبر است" });
        if (!text)
            return response.status(400).json({ success: false, message: "متن بازخورد نمی‌تونه خالی باشه" });
        if (text.length > MAX_LEN)
            return response.status(400).json({ success: false, message: `متن بازخورد نباید بیشتر از ${MAX_LEN} کاراکتر باشه` });

        const target = await Target.findByPk(target_id);
        if (!target)
            return response.status(404).json({ success: false, message: "گزارش یا تحلیل مورد نظر پیدا نشد" });

        if (!(await canAccessStudent(request, target.user_id)))
            return response.status(403).json({ success: false, message: "این دانش‌آموز جزو دانش‌آموزهای شما نیست" });

        const feedback = await ReportFeedback.create({
            target_type,
            target_id,
            user_id: target.user_id,
            author_role: request.role,
            author_id: request.user.id,
            author_name: authorName(request),
            text,
        });

        return response.status(201).json({ success: true, data: feedback });
    } catch (error) {
        return response.status(500).json({ success: false, message: "خطا در ثبت بازخورد", error: error.message });
    }
};

// PUT /feedbacks/:id  { text } — فقط نویسنده‌ی بازخورد
exports.update = async (request, response) => {
    try {
        const feedback = await ReportFeedback.findByPk(request.params.id);
        if (!feedback)
            return response.status(404).json({ success: false, message: "بازخورد پیدا نشد" });
        if (feedback.author_role !== request.role || feedback.author_id !== request.user.id)
            return response.status(403).json({ success: false, message: "فقط نویسنده‌ی بازخورد می‌تونه ویرایشش کنه" });

        const text = (request.body.text || "").trim();
        if (!text)
            return response.status(400).json({ success: false, message: "متن بازخورد نمی‌تونه خالی باشه" });
        if (text.length > MAX_LEN)
            return response.status(400).json({ success: false, message: `متن بازخورد نباید بیشتر از ${MAX_LEN} کاراکتر باشه` });

        await feedback.update({ text });
        return response.status(200).json({ success: true, data: feedback });
    } catch (error) {
        return response.status(500).json({ success: false, message: "خطا در ویرایش بازخورد", error: error.message });
    }
};

// DELETE /feedbacks/:id — نویسنده یا ادمین
exports.remove = async (request, response) => {
    try {
        const feedback = await ReportFeedback.findByPk(request.params.id);
        if (!feedback)
            return response.status(404).json({ success: false, message: "بازخورد پیدا نشد" });

        const isAuthor = feedback.author_role === request.role && feedback.author_id === request.user.id;
        if (!isAuthor && request.role !== "admin")
            return response.status(403).json({ success: false, message: "اجازه‌ی حذف این بازخورد رو ندارید" });

        await feedback.destroy();
        return response.status(200).json({ success: true, message: "بازخورد حذف شد" });
    } catch (error) {
        return response.status(500).json({ success: false, message: "خطا در حذف بازخورد", error: error.message });
    }
};
