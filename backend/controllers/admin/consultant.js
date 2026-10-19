const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { Consultant, User, DailyReport, AnalysisExam, ExamSchedule, TuitionPayment } = require("../../models");

// فقط ادمین می‌تونه حساب مشاور بسازه
exports.create = async (request, response) => {
    try {
        const {
            name, lastname, email, consultant_password, phone_number,
            telegram_id, profile_image, counseling_fields, consultation_type,
            experience_years, education, skills, bio
        } = request.body;

        const existing = await Consultant.findOne({ where: { email } });
        if (existing)
            return response.status(409).json({ success: false, message: "این ایمیل قبلاً برای یک مشاور ثبت شده است" });

        const hashedPassword = await bcrypt.hash(consultant_password, 10);

        const consultant = await Consultant.create({
            name, lastname, email,
            consultant_password: hashedPassword,
            phone_number, telegram_id, profile_image,
            counseling_fields, consultation_type,
            experience_years, education, skills, bio,
        });

        return response.status(201).json({
            success: true,
            message: "حساب مشاور با موفقیت ساخته شد.",
            data: consultant
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در ساخت حساب مشاور",
            error: error.message
        });
    }
};

exports.getAll = async (request, response) => {
    try {
        const { is_active } = request.query;
        const where = {};
        if (is_active === "true") where.is_active = true;
        if (is_active === "false") where.is_active = false;

        const consultants = await Consultant.findAll({ where, order: [["created_at", "DESC"]] });
        return response.status(200).json({ success: true, data: consultants });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت لیست مشاوران",
            error: error.message
        });
    }
};

exports.getOne = async (request, response) => {
    try {
        const { id } = request.params;
        // لیست دانش‌آموزها اینجا include نمی‌شه (می‌تونه خیلی بزرگ باشه)؛
        // برای اون از GET /admin/consultants/:id/students (صفحه‌بندی‌شده) استفاده کن.
        const consultant = await Consultant.findByPk(id);
        if (!consultant)
            return response.status(404).json({ success: false, message: "مشاور یافت نشد!" });

        const studentsCount = await User.count({ where: { consultant_id: id, role: "student" } });

        return response.status(200).json({ success: true, data: { ...consultant.toJSON(), studentsCount } });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت اطلاعات مشاور",
            error: error.message
        });
    }
};

// GET /admin/consultants/:id/students -> لیست صفحه‌بندی‌شده‌ی دانش‌آموزان یک مشاورِ خاص
// (برای تب «دانش‌آموزان این مشاور» در جزئیات مشاور، با همون فلگ‌های وضعیت
// گزارش/تحلیل/شهریه که در پنل مشاور و پنل دانش‌آموزانِ ادمین استفاده می‌شه)
exports.getStudents = async (request, response) => {
    try {
        const { id } = request.params;
        const { search, page = 1, limit = 4 } = request.query;

        const consultant = await Consultant.findByPk(id);
        if (!consultant)
            return response.status(404).json({ success: false, message: "مشاور یافت نشد!" });

        const where = { consultant_id: id, role: "student" };
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { lastname: { [Op.like]: `%${search}%` } },
            ];
        }

        const parsedLimit = Math.min(Number(limit) || 4, 50);
        const parsedPage = Math.max(Number(page) || 1, 1);

        const { count, rows } = await User.findAndCountAll({
            where,
            order: [["created_at", "DESC"]],
            limit: parsedLimit,
            offset: (parsedPage - 1) * parsedLimit,
        });

        const studentIds = rows.map((r) => r.id);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [todaysReports, latestExamSchedule, unpaidPayments] = await Promise.all([
            studentIds.length
                ? DailyReport.findAll({
                    where: { user_id: { [Op.in]: studentIds }, report_date: { [Op.between]: [todayStart, todayEnd] } },
                    attributes: ["user_id"],
                })
                : [],
            ExamSchedule.findOne({ order: [["exam_date", "DESC"]] }),
            studentIds.length
                ? TuitionPayment.findAll({ where: { user_id: { [Op.in]: studentIds }, status: "unpaid" }, attributes: ["user_id"] })
                : [],
        ]);
        const reportedTodayIds = new Set(todaysReports.map((r) => r.user_id));
        const unpaidIds = new Set(unpaidPayments.map((p) => p.user_id));

        let analyzedLatestExamIds = new Set();
        if (latestExamSchedule && studentIds.length) {
            // فرم تحلیل آزمون سمت دانش‌آموز فعلاً exam_schedule_id ارسال نمی‌کنه،
            // پس هر تحلیلی که بعد از تاریخ برگزاری آخرین آزمون ثبت شده باشه رو هم
            // به‌عنوان "تحلیل این آزمون" حساب می‌کنیم، نه فقط تطابق دقیق آی‌دی.
            const analyses = await AnalysisExam.findAll({
                where: {
                    user_id: { [Op.in]: studentIds },
                    [Op.or]: [
                        { exam_schedule_id: latestExamSchedule.id },
                        { created_at: { [Op.gte]: latestExamSchedule.exam_date } },
                    ],
                },
                attributes: ["user_id"],
            });
            analyzedLatestExamIds = new Set(analyses.map((a) => a.user_id));
        }

        const data = rows.map((u) => {
            const plain = u.toJSON();
            plain.reported_today = reportedTodayIds.has(u.id);
            plain.analyzed_latest_exam = latestExamSchedule ? analyzedLatestExamIds.has(u.id) : null;
            plain.unpaid = unpaidIds.has(u.id);
            return plain;
        });

        const totalPages = Math.ceil(count / parsedLimit) || 1;

        return response.status(200).json({
            success: true,
            data,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: parsedPage,
                itemsPerPage: parsedLimit,
                hasNextPage: parsedPage < totalPages,
                hasPrevPage: parsedPage > 1,
            },
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت دانش‌آموزان مشاور",
            error: error.message,
        });
    }
};

exports.update = async (request, response) => {
    try {
        const { id } = request.params;
        const {
            name, lastname, phone_number, telegram_id, profile_image,
            counseling_fields, consultation_type, experience_years,
            education, skills, bio, is_active, consultant_password
        } = request.body;

        const consultant = await Consultant.findByPk(id);
        if (!consultant)
            return response.status(404).json({ success: false, message: "مشاور یافت نشد!" });

        const updateData = {
            name: name ?? consultant.name,
            lastname: lastname ?? consultant.lastname,
            phone_number: phone_number ?? consultant.phone_number,
            telegram_id: telegram_id ?? consultant.telegram_id,
            profile_image: profile_image ?? consultant.profile_image,
            counseling_fields: counseling_fields ?? consultant.counseling_fields,
            consultation_type: consultation_type ?? consultant.consultation_type,
            experience_years: experience_years ?? consultant.experience_years,
            education: education ?? consultant.education,
            skills: skills ?? consultant.skills,
            bio: bio ?? consultant.bio,
            is_active: is_active ?? consultant.is_active,
        };

        if (consultant_password) {
            updateData.consultant_password = await bcrypt.hash(consultant_password, 10);
        }

        // اگه مشاور از فعال به غیرفعال تغییر کنه، دیگه نباید دانش‌آموزی زیر
        // نظرش بمونه — همه‌ی دانش‌آموزهای این مشاور به کاربر عادی تبدیل می‌شن
        // (دقیقاً همون کاری که برای حذف تک‌به‌تکِ هر دانش‌آموز از لیست مشاور
        // انجام می‌شه: شهریه‌ش پاک می‌شه و رکوردهای پرداخت‌نشده‌ش حذف می‌شن).
        const wasActive = consultant.is_active;
        const willBeActive = updateData.is_active;

        await consultant.update(updateData);

        if (wasActive && willBeActive === false) {
            const students = await User.findAll({ where: { consultant_id: consultant.id, role: "student" } });
            if (students.length) {
                const studentIds = students.map((s) => s.id);
                await User.update(
                    { role: "user", consultant_id: null, tuition_amount: null },
                    { where: { id: { [Op.in]: studentIds } } }
                );
                await TuitionPayment.destroy({ where: { user_id: { [Op.in]: studentIds }, status: "unpaid" } });
            }
        }

        return response.status(200).json({
            success: true,
            message: "اطلاعات مشاور به‌روزرسانی شد.",
            data: consultant
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در به‌روزرسانی اطلاعات مشاور",
            error: error.message
        });
    }
};

exports.remove = async (request, response) => {
    try {
        const { id } = request.params;
        const consultant = await Consultant.findByPk(id);
        if (!consultant)
            return response.status(404).json({ success: false, message: "مشاور یافت نشد!" });

        await User.update({ consultant_id: null, role: "user" }, { where: { consultant_id: id } });
        await consultant.destroy();

        return response.status(200).json({ success: true, message: "مشاور حذف شد." });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در حذف مشاور",
            error: error.message
        });
    }
};
