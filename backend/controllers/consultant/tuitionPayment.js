const moment = require("moment-jalaali");
const { TuitionPayment: TuitionPaymentModel, User: UserModel } = require("../../models");

function currentJalaliMonthYear() {
    const m = moment();
    return { jalali_year: m.jYear(), jalali_month: m.jMonth() + 1 };
}

exports.getUnpaidTuitionPayments = async (request, response) => {
    try {
        const consultant = request.user;
        const unpaidTuitionPayments = await TuitionPaymentModel.findAll({
            where: {
                consultant_id: consultant.id,
                status: "unpaid"
            },
            include: [{
                model: UserModel,
                as: "user"
            }],
            order: [["jalali_year", "DESC"], ["jalali_month", "DESC"]]
        });

        return response.status(200).json({
            success: true,
            data: unpaidTuitionPayments
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error get unpaid tuition payments",
            error: error.message
        });
    }
};

exports.getPaidTuitionPayments = async (request, response) => {
    try {
        const consultant = request.user;
        const paidTuitionPayments = await TuitionPaymentModel.findAll({
            where: {
                consultant_id: consultant.id,
                status: "paid"
            },
            include: [{
                model: UserModel,
                as: "user"
            }],
            order: [["jalali_year", "DESC"], ["jalali_month", "DESC"]]
        });

        return response.status(200).json({
            success: true,
            data: paidTuitionPayments
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error get paid tuition payments",
            error: error.message
        });
    };
};

// مشاور شهریه‌ی یک دانش‌آموز رو برای «ماه جاری» (یا ماهی که مشخص کنه) به پرداخت‌شده تغییر می‌ده
exports.changeTuitionPaymentStatus = async (request, response) => {
    try {
        const consultant = request.user;
        const { userId } = request.params;
        const { status, amount, jalali_year, jalali_month } = request.body;

        if (!["paid", "unpaid"].includes(status))
            return response.status(400).json({
                success: false,
                message: "وضعیت نامعتبر است (باید paid یا unpaid باشد)"
            });

        const period = (jalali_year && jalali_month)
            ? { jalali_year, jalali_month }
            : currentJalaliMonthYear();

        const [tuitionPayment] = await TuitionPaymentModel.findOrCreate({
            where: {
                consultant_id: consultant.id,
                user_id: userId,
                jalali_year: period.jalali_year,
                jalali_month: period.jalali_month,
            },
            defaults: { status: "unpaid" }
        });

        await tuitionPayment.update({
            status,
            amount: status === "paid" ? (amount ?? tuitionPayment.amount) : tuitionPayment.amount,
            paid_at: status === "paid" ? new Date() : null,
            source: status === "paid" ? "admin_manual" : null,
        });

        await tuitionPayment.reload({
            include: [{
                model: UserModel,
                as: "user"
            }]
        });

        return response.status(200).json({
            success: true,
            message: "وضعیت شهریه به‌روزرسانی شد.",
            data: tuitionPayment
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در به‌روزرسانی وضعیت شهریه!",
            error: error.message
        });
    };
};
