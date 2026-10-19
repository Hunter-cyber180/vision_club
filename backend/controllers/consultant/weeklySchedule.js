const { WeeklySchedule: WeeklyScheduleModel, User: UserModel } = require("../../models");

exports.sendweeklySchedule = async (request, response) => {
    try {
        const { userId } = request.params;
        const { date, title, file_url } = request.body;

        const user = await UserModel.findByPk(userId);
        if(!user)
            return response.status(404).json({
                success: false,
                message: "User not found!"
            });

        // اگه ادمین از پنل خودش برنامه می‌فرسته، consultant_id باید همون مشاور
        // واقعیِ این دانش‌آموز باشه، نه آی‌دی حساب ادمین (که اصلاً توی جدول
        // consultants وجود نداره). مشاور خودش فقط برای دانش‌آموز خودش این کارو می‌کنه.
        const consultantId = request.role === "admin" ? user.consultant_id : request.user.id;
        if (!consultantId)
            return response.status(400).json({
                success: false,
                message: "این دانش‌آموز هنوز به هیچ مشاوری متصل نیست."
            });

        const weeklySchedule = await WeeklyScheduleModel.create({
            consultant_id: consultantId,
            user_id: user.id,
            date,
            title,
            file_url
        });
        
        return response.status(201).json({
            success: true,
            message: "Weekly schedule sent to user.",
            data: weeklySchedule
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error sending weekly schedule!",
            error: error.message
        });
    };
};
