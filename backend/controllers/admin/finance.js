const { Charge, TuitionPayment, User, Consultant } = require("../../models");
const { Op } = require("sequelize");

// GET /admin/finance/summary -> کارت‌های خلاصه‌ی بالای صفحه‌ی مالی + داشبورد
exports.getSummary = async (request, response) => {
    try {
        const totalCharged = (await Charge.sum("charge_amount")) || 0;
        const totalTuitionPaid = (await TuitionPayment.sum("amount", { where: { status: "paid" } })) || 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const chargesLast30d = await Charge.count({ where: { created_at: { [Op.gte]: thirtyDaysAgo } } });
        const tuitionLast30d = await TuitionPayment.count({
            where: { status: "paid", paid_at: { [Op.gte]: thirtyDaysAgo } },
        });

        const unpaidTuitionCount = await TuitionPayment.count({ where: { status: "unpaid" } });

        // درآمد «همین ماه شمسی/میلادی جاری» (برای کارت داشبورد)
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const chargedThisMonth = (await Charge.sum("charge_amount", {
            where: { created_at: { [Op.gte]: monthStart } },
        })) || 0;
        const tuitionPaidThisMonth = (await TuitionPayment.sum("amount", {
            where: { status: "paid", paid_at: { [Op.gte]: monthStart } },
        })) || 0;

        const totalStudents = await User.count({ where: { role: "student" } });
        const totalConsultants = await Consultant.count();

        return response.status(200).json({
            success: true,
            data: {
                totalCharged,
                totalTuitionPaid,
                totalRevenue: totalCharged + totalTuitionPaid,
                revenueThisMonth: chargedThisMonth + tuitionPaidThisMonth,
                transactionsLast30d: chargesLast30d + tuitionLast30d,
                unpaidTuitionCount,
                totalStudents,
                totalConsultants,
            },
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت خلاصه‌ی مالی",
            error: error.message,
        });
    }
};

// GET /admin/finance/unpaid-students -> دانش‌آموزهایی که شهریه‌شون پرداخت‌نشده (برای داشبورد و فیلتر «پرداخت‌نشده» در پنل دانش‌آموزان)
exports.getUnpaidStudents = async (request, response) => {
    try {
        const { limit } = request.query;
        const unpaid = await TuitionPayment.findAll({
            where: { status: "unpaid" },
            include: [
                // اگه دانش‌آموزی بعداً به کاربر عادی تبدیل بشه (و به هر دلیلی رکورد
                // شهریه‌ش پاک نشده باشه)، required:true باعث می‌شه اینجا دیگه نشون
                // داده نشه — چون کاربر عادی اصلاً شهریه‌ای نداره.
                { model: User, as: "user", attributes: ["id", "name", "lastname", "role"], where: { role: "student" }, required: true },
                { model: Consultant, as: "consultant", attributes: ["id", "name", "lastname"] },
            ],
            order: [["jalali_year", "DESC"], ["jalali_month", "DESC"]],
            limit: limit ? Math.min(Number(limit) || 20, 100) : undefined,
        });

        return response.status(200).json({ success: true, data: unpaid });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت لیست پرداخت‌نشده‌ها",
            error: error.message,
        });
    }
};

// GET /admin/finance/transactions -> لیست واقعی تراکنش‌ها (شارژ کیف پول + شهریه‌ی پرداخت‌شده)،
// ادغام و مرتب‌شده بر اساس تاریخ، با صفحه‌بندی واقعی (تا لیست در فرانت دراز نشه).
// چون این لیست از دو جدول جدا (charges و tuition_payments) ادغام می‌شه، نمی‌شه
// مستقیم OFFSET/LIMIT جداگانه روی هرکدوم زد و انتظار ترتیب درست داشت؛ به‌جاش
// از هر دو جدول به اندازه‌ی کافی (تا انتهای صفحه‌ی درخواستی) می‌گیریم، ادغام و
// مرتب می‌کنیم، و بعد دقیقاً همون صفحه رو برش می‌زنیم.
exports.getTransactions = async (request, response) => {
    try {
        const { page = 1, limit = 10 } = request.query;
        const parsedLimit = Math.min(Number(limit) || 10, 100);
        const parsedPage = Math.max(Number(page) || 1, 1);
        const needed = parsedPage * parsedLimit; // تا انتهای صفحه‌ی درخواستی چند ردیف لازمه

        const [chargesCount, tuitionsCount, charges, tuitions] = await Promise.all([
            Charge.count(),
            TuitionPayment.count({ where: { status: "paid" } }),
            Charge.findAll({
                include: [{ model: User, as: "user", attributes: ["id", "name", "lastname"] }],
                order: [["created_at", "DESC"]],
                limit: needed,
            }),
            TuitionPayment.findAll({
                where: { status: "paid" },
                include: [{ model: User, as: "user", attributes: ["id", "name", "lastname"] }],
                order: [["paid_at", "DESC"]],
                limit: needed,
            }),
        ]);

        const totalItems = chargesCount + tuitionsCount;

        const merged = [
            ...charges.map((c) => ({
                id: `charge-${c.id}`,
                type: "charge",
                title: "شارژ کیف پول",
                userName: c.user ? [c.user.name, c.user.lastname].filter(Boolean).join(" ") : "کاربر حذف‌شده",
                amount: c.charge_amount,
                date: c.created_at,
            })),
            ...tuitions.map((t) => ({
                id: `tuition-${t.id}`,
                type: "tuition",
                title: "پرداخت شهریه",
                userName: t.user ? [t.user.name, t.user.lastname].filter(Boolean).join(" ") : "کاربر حذف‌شده",
                amount: t.amount,
                date: t.paid_at,
            })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        const start = (parsedPage - 1) * parsedLimit;
        const pageItems = merged.slice(start, start + parsedLimit);
        const totalPages = Math.ceil(totalItems / parsedLimit) || 1;

        return response.status(200).json({
            success: true,
            data: pageItems,
            pagination: {
                totalItems,
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
            message: "خطا در دریافت تراکنش‌ها",
            error: error.message,
        });
    }
};

// GET /admin/finance/monthly -> نمودار درآمد ۶ ماه اخیر (بر اساس تاریخ میلادیِ created_at/paid_at، چون jalali_year/jalali_month فقط برای شهریه ثبت می‌شه نه شارژ)
exports.getMonthlyRevenue = async (request, response) => {
    try {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            months.push({ label: d.toLocaleDateString("fa-IR", { month: "long" }), start, end });
        }

        const values = [];
        for (const m of months) {
            const chargeSum = (await Charge.sum("charge_amount", {
                where: { created_at: { [Op.gte]: m.start, [Op.lt]: m.end } },
            })) || 0;
            const tuitionSum = (await TuitionPayment.sum("amount", {
                where: { status: "paid", paid_at: { [Op.gte]: m.start, [Op.lt]: m.end } },
            })) || 0;
            values.push(chargeSum + tuitionSum);
        }

        return response.status(200).json({
            success: true,
            data: { labels: months.map((m) => m.label), values },
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت نمودار درآمد",
            error: error.message,
        });
    }
};
