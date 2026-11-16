// services/tuitionPaymentCheckService.js
const moment = require("moment-jalaali");
const { User, TuitionPayment } = require("../models");

class TuitionPaymentCheckService {
    static async checkCurrentMonthPayments() {
        const now = moment();
        const jalaliYear = now.jYear();
        const jalaliMonth = now.jMonth() + 1;

        const students = await User.findAll({
            where: { role: "student" },
            attributes: ["id", "consultant_id"],
        });

        const studentsWithConsultant = students.filter((s) => !!s.consultant_id);

        if (studentsWithConsultant.length === 0) {
            return { checkedStudents: 0, jalaliYear, jalaliMonth, newUnpaidCount: 0, paidCount: 0, unpaidCount: 0 };
        }

        let newUnpaidCount = 0;
        for (const student of studentsWithConsultant) {
            const [, created] = await TuitionPayment.findOrCreate({
                where: {
                    user_id: student.id,
                    jalali_year: jalaliYear,
                    jalali_month: jalaliMonth,
                },
                defaults: {
                    user_id: student.id,
                    consultant_id: student.consultant_id,
                    jalali_year: jalaliYear,
                    jalali_month: jalaliMonth,
                    status: "unpaid",
                },
            });
            if (created) newUnpaidCount++;
        }

        const records = await TuitionPayment.findAll({
            where: {
                jalali_year: jalaliYear,
                jalali_month: jalaliMonth,
                user_id: studentsWithConsultant.map((s) => s.id),
            },
            attributes: ["status"],
            raw: true,
        });
        const paidCount = records.filter((r) => r.status === "paid").length;
        const unpaidCount = records.filter((r) => r.status === "unpaid").length;

        return {
            checkedStudents: studentsWithConsultant.length,
            jalaliYear,
            jalaliMonth,
            newUnpaidCount,
            paidCount,
            unpaidCount,
        };
    }
}

module.exports = TuitionPaymentCheckService;
