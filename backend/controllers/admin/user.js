const { User, Consultant, DailyReport, AnalysisExam, ExamSchedule, TuitionPayment } = require("../../models");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

// برای هر دانش‌آموز (role=student) توی لیست، اینکه واقعاً «امروز» گزارش کار
// فرستاده و برای آخرین آزمون جامع واقعاً تحلیل فرستاده رو مستقیم از جدول‌های
// واقعی چک می‌کنه — دقیقاً همون منطقی که در پنل مشاور (controllers/consultant/user.js)
// استفاده می‌شه، تا پنل دانش‌آموزان ادمین هم همون رفتار رو داشته باشه.
async function attachStatusFlags(people) {
    const studentIds = people.filter((p) => p.role === "student").map((p) => p.id);
    if (studentIds.length === 0) return people;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todaysReports, latestExamSchedule] = await Promise.all([
        DailyReport.findAll({
            where: { user_id: { [Op.in]: studentIds }, report_date: { [Op.between]: [todayStart, todayEnd] } },
            attributes: ["user_id"],
        }),
        ExamSchedule.findOne({ order: [["exam_date", "DESC"]] }),
    ]);
    const reportedTodayIds = new Set(todaysReports.map((r) => r.user_id));

    let analyzedLatestExamIds = new Set();
    if (latestExamSchedule) {
        // فرم تحلیل آزمون سمت دانش‌آموز فعلاً exam_schedule_id رو انتخاب/ارسال
        // نمی‌کنه (اون فیلد فقط برای وقتیه که بعداً از روی آزمون رسمی ادمین پر بشه)،
        // برای همین اگه فقط دنبال تطابق exam_schedule_id بگردیم، هیچ‌وقت هیچ
        // دانش‌آموزی "تحلیل‌کرده" حساب نمی‌شه، حتی وقتی واقعاً فرم رو فرستاده.
        // پس هر تحلیلی که بعد از تاریخ برگزاری آخرین آزمون ثبت شده باشه رو هم
        // به‌عنوان "تحلیل این آزمون" حساب می‌کنیم.
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

    return people.map((p) => {
        if (p.role !== "student") return p;
        return {
            ...p,
            reported_today: reportedTodayIds.has(p.id),
            analyzed_latest_exam: latestExamSchedule ? analyzedLatestExamIds.has(p.id) : null,
        };
    });
}

// لیست همه‌ی کاربران (role=user, هنوز به دانش‌آموزی تبدیل نشده‌اند)
exports.getAllUsers = async (request, response) => {
    try {
        const { search } = request.query;
        const where = { role: "user" };
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { lastname: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { student_number: { [Op.like]: `%${search}%` } },
            ];
        }

        const users = await User.findAll({ where, order: [["created_at", "DESC"]] });
        return response.status(200).json({ success: true, data: users });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت لیست کاربران",
            error: error.message
        });
    }
};

// لیست همه‌ی کاربران سایت با هر دو نقش (user و student) با هم، یکجا —
// برای تب یکپارچه‌ی «کاربران» در پنل ادمین (نه دو تب جدا)
exports.getAllPeople = async (request, response) => {
    try {
        const { search } = request.query;
        const where = { role: { [Op.in]: ["user", "student"] } };
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { lastname: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { student_number: { [Op.like]: `%${search}%` } },
            ];
        }

        const peopleRows = await User.findAll({
            where,
            include: [{ model: Consultant, as: "consultant", attributes: ["id", "name", "lastname"] }],
            order: [["created_at", "DESC"]],
        });

        const people = await attachStatusFlags(peopleRows.map((p) => p.toJSON()));

        return response.status(200).json({ success: true, data: people });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت لیست کاربران",
            error: error.message
        });
    }
};

// لیست همه‌ی دانش‌آموزان (role=student)
exports.getAllStudents = async (request, response) => {
    try {
        const { search, consultant_id } = request.query;
        const where = { role: "student" };
        if (consultant_id) where.consultant_id = consultant_id;
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { lastname: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { student_number: { [Op.like]: `%${search}%` } },
            ];
        }

        const students = await User.findAll({
            where,
            include: [{ model: Consultant, as: "consultant", attributes: ["id", "name", "lastname"] }],
            order: [["created_at", "DESC"]]
        });

        return response.status(200).json({ success: true, data: students });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت لیست دانش‌آموزان",
            error: error.message
        });
    }
};

// ادمین مستقیم یک دانش‌آموز جدید می‌سازه (همون فیلدهای فرم ثبت‌نام عمومی + انتخاب مشاور)
exports.createStudent = async (request, response) => {
    try {
        const {
            name, lastname, email, user_password,
            birthday, gender, city, student_number, father_number, mother_number,
            telegram_id, degree, grade_10_gpa, grade_11_gpa, grade_12_gpa,
            is_retaker, entrance_exam_attempts, prev_national_rank,
            preferred_major, preferred_universities, notes, consultant_id,
        } = request.body;

        const existing = await User.findOne({ where: { email } });
        if (existing)
            return response.status(409).json({ success: false, message: "این ایمیل قبلاً ثبت شده است" });

        const consultant = await Consultant.findByPk(consultant_id);
        if (!consultant)
            return response.status(404).json({ success: false, message: "مشاور یافت نشد!" });

        const hashedPassword = await bcrypt.hash(user_password, 10);

        const student = await User.create({
            name, lastname, email, user_password: hashedPassword,
            birthday, gender, city, student_number, father_number, mother_number,
            telegram_id, degree, grade_10_gpa, grade_11_gpa, grade_12_gpa,
            is_retaker, entrance_exam_attempts, prev_national_rank,
            preferred_major, preferred_universities, notes,
            role: "student", consultant_id,
        });

        return response.status(201).json({
            success: true,
            message: "دانش‌آموز با موفقیت ثبت شد.",
            data: student,
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در ثبت دانش‌آموز",
            error: error.message
        });
    }
};

// ادمین دستی role رو تغییر می‌ده (user <-> student) و در صورت لزوم مشاور رو تعیین می‌کنه
exports.setUserRole = async (request, response) => {
    try {
        const { userId } = request.params;
        const { role, consultant_id } = request.body;

        if (!["user", "student"].includes(role))
            return response.status(400).json({ success: false, message: "role باید user یا student باشد" });

        const user = await User.findByPk(userId);
        if (!user)
            return response.status(404).json({ success: false, message: "کاربر یافت نشد!" });

        if (role === "student") {
            if (!consultant_id)
                return response.status(400).json({ success: false, message: "برای تبدیل به دانش‌آموز، مشاور باید مشخص شود" });

            const consultant = await Consultant.findByPk(consultant_id);
            if (!consultant)
                return response.status(404).json({ success: false, message: "مشاور یافت نشد!" });

            await user.update({ role: "student", consultant_id });
        } else {
            // کاربر عادی نه دانش‌آموزه نه شهریه‌ای داره؛ وقتی از دانش‌آموزی به
            // کاربر عادی برمی‌گرده، مبلغ شهریه‌ش پاک می‌شه و رکوردهای شهریه‌ی
            // پرداخت‌نشده‌ش هم حذف می‌شن تا توی لیست "نیازمند پیگیری"/"پرداخت‌نشده"
            // به‌اشتباه باقی نمونه (سابقه‌ی شهریه‌های پرداخت‌شده برای گزارش مالی نگه داشته می‌شه).
            await user.update({ role: "user", consultant_id: null, tuition_amount: null });
            await TuitionPayment.destroy({ where: { user_id: user.id, status: "unpaid" } });
        }

        return response.status(200).json({
            success: true,
            message: "نقش کاربر با موفقیت تغییر کرد.",
            data: user
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در تغییر نقش کاربر",
            error: error.message
        });
    }
};

// ادمین می‌تونه هر فیلدی از اطلاعات یک کاربر/دانش‌آموز رو ویرایش کنه
exports.updateUser = async (request, response) => {
    try {
        const { userId } = request.params;
        const user = await User.findByPk(userId);
        if (!user)
            return response.status(404).json({ success: false, message: "کاربر یافت نشد!" });

        const {
            name, lastname, email, birthday, gender, city,
            student_number, father_number, mother_number, telegram_id,
            degree, grade_10_gpa, grade_11_gpa, grade_12_gpa,
            is_retaker, entrance_exam_attempts, prev_national_rank,
            preferred_major, preferred_universities, notes, consultant_id,
        } = request.body;

        if (email && email !== user.email) {
            const existing = await User.findOne({ where: { email } });
            if (existing)
                return response.status(409).json({ success: false, message: "این ایمیل قبلاً برای کاربر دیگری ثبت شده است" });
        }

        if (consultant_id) {
            const consultant = await Consultant.findByPk(consultant_id);
            if (!consultant)
                return response.status(404).json({ success: false, message: "مشاور یافت نشد!" });
        }

        await user.update({
            name: name ?? user.name,
            lastname: lastname ?? user.lastname,
            email: email ?? user.email,
            birthday: birthday ?? user.birthday,
            gender: gender ?? user.gender,
            city: city ?? user.city,
            student_number: student_number ?? user.student_number,
            father_number: father_number ?? user.father_number,
            mother_number: mother_number ?? user.mother_number,
            telegram_id: telegram_id ?? user.telegram_id,
            degree: degree ?? user.degree,
            grade_10_gpa: grade_10_gpa ?? user.grade_10_gpa,
            grade_11_gpa: grade_11_gpa ?? user.grade_11_gpa,
            grade_12_gpa: grade_12_gpa ?? user.grade_12_gpa,
            is_retaker: is_retaker ?? user.is_retaker,
            entrance_exam_attempts: entrance_exam_attempts ?? user.entrance_exam_attempts,
            prev_national_rank: prev_national_rank ?? user.prev_national_rank,
            preferred_major: preferred_major ?? user.preferred_major,
            preferred_universities: preferred_universities ?? user.preferred_universities,
            notes: notes ?? user.notes,
            consultant_id: consultant_id !== undefined ? consultant_id : user.consultant_id,
        });

        return response.status(200).json({
            success: true,
            message: "اطلاعات کاربر با موفقیت به‌روزرسانی شد.",
            data: user,
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در به‌روزرسانی اطلاعات کاربر",
            error: error.message
        });
    }
};

// ادمین یک کاربر/دانش‌آموز رو کاملاً از سیستم حذف می‌کنه (نه فقط تغییر role)
exports.deleteUser = async (request, response) => {
    try {
        const { userId } = request.params;
        const user = await User.findByPk(userId);
        if (!user)
            return response.status(404).json({ success: false, message: "کاربر یافت نشد!" });

        await user.destroy();

        return response.status(200).json({
            success: true,
            message: "کاربر با موفقیت حذف شد.",
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در حذف کاربر",
            error: error.message
        });
    }
};
