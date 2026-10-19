const moment = require("moment-jalaali");
const { TuitionPayment, Charge, WeeklySchedule, User } = require("../../models");

// GET /user-panel/tuition-payments/mine -> تاریخچه شهریه‌ی خودِ دانش‌آموز
exports.getMyTuitionPayments = async (request, response) => {
    try {
        const user = request.user;
        const tuitionPayments = await TuitionPayment.findAll({
            where: { user_id: user.id },
            order: [["jalali_year", "DESC"], ["jalali_month", "DESC"]],
        });

        return response.status(200).json({ success: true, data: tuitionPayments });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت تاریخچه‌ی شهریه",
            error: error.message,
        });
    }
};

// GET /user-panel/charge/mine -> تاریخچه‌ی شارژ کیف پول خودِ کاربر (به‌همراه موجودی فعلی)
exports.getMyCharges = async (request, response) => {
    try {
        const user = request.user;
        const charges = await Charge.findAll({
            where: { user_id: user.id },
            order: [["created_at", "DESC"]],
        });

        return response.status(200).json({
            success: true,
            data: {
                balance: user.charge_amount,
                charges,
            },
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت تاریخچه‌ی کیف پول",
            error: error.message,
        });
    }
};

// POST /user-panel/mine/tuition-payments/pay -> پرداخت شهریه‌ی «ماه جاری» مستقیم از موجودی کیف پول
// (فقط دانش‌آموز؛ نیازی به تایید مشاور/ادمین نیست چون مبلغ از قبل توسط مشاور تعیین شده)
exports.payTuitionFromWallet = async (request, response) => {
    try {
        const authUser = request.user;

        // تازه‌ترین موجودی/مبلغ شهریه رو مستقیم از دیتابیس بخون (نه از توکن/کش)
        const user = await User.findByPk(authUser.id);
        if (!user)
            return response.status(404).json({ success: false, message: "کاربر یافت نشد!" });

        if (!user.consultant_id)
            return response.status(400).json({
                success: false,
                message: "شما هنوز به هیچ مشاوری متصل نیستید.",
            });

        if (user.tuition_amount === null || user.tuition_amount === undefined)
            return response.status(400).json({
                success: false,
                message: "مبلغ شهریه‌ی شما هنوز توسط مشاور مشخص نشده است.",
            });

        const now = moment();
        const jalaliYear = now.jYear();
        const jalaliMonth = now.jMonth() + 1;

        const [tuitionPayment] = await TuitionPayment.findOrCreate({
            where: { user_id: user.id, jalali_year: jalaliYear, jalali_month: jalaliMonth },
            defaults: {
                user_id: user.id,
                consultant_id: user.consultant_id,
                jalali_year: jalaliYear,
                jalali_month: jalaliMonth,
                status: "unpaid",
            },
        });

        if (tuitionPayment.status === "paid")
            return response.status(400).json({
                success: false,
                message: "شهریه‌ی این ماه قبلاً پرداخت شده است.",
            });

        const amount = user.tuition_amount;

        if (user.charge_amount < amount)
            return response.status(400).json({
                success: false,
                message: "موجودی کیف پول کافی نیست. لطفاً ابتدا کیف پولت رو شارژ کن.",
            });

        // کسر از کیف پول
        await user.update({ charge_amount: user.charge_amount - amount });

        // ثبت پرداخت شهریه
        await tuitionPayment.update({
            status: "paid",
            amount,
            paid_at: new Date(),
            source: "wallet",
        });

        return response.status(200).json({
            success: true,
            message: "شهریه با موفقیت از کیف پول پرداخت شد.",
            data: {
                tuitionPayment,
                balance: user.charge_amount,
            },
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در پرداخت شهریه از کیف پول",
            error: error.message,
        });
    }
};

// GET /user-panel/weekly-stats -> آمار هفته‌ی اخیر خودِ دانش‌آموز (برای سه
// نمودار داشبورد: روند تراز، حجم تست/تشریحی، حجم مطالعه‌ی روزانه)
exports.getMyWeeklyStats = async (request, response) => {
    try {
        const { computeWeeklyStats } = require("../../utils/weeklyStats");
        const stats = await computeWeeklyStats(request.user.id);
        return response.status(200).json({ success: true, data: stats });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت آمار هفتگی",
            error: error.message,
        });
    }
};

// GET /user-panel/weekly-schedules/mine -> برنامه‌های هفتگی ارسال‌شده توسط مشاورِ خودِ دانش‌آموز
exports.getMyWeeklySchedules = async (request, response) => {
    try {
        const user = request.user;
        const weeklySchedules = await WeeklySchedule.findAll({
            where: { user_id: user.id },
            order: [["date", "DESC"]],
        });

        return response.status(200).json({ success: true, data: weeklySchedules });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت برنامه‌های هفتگی",
            error: error.message,
        });
    }
};
