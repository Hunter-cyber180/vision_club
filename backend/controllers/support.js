const configs = require("../configs");

// پشتیبانی سایت فقط یک نفره و اطلاعاتش ثابته؛ برای همه‌ی نقش‌ها (کاربر/دانش‌آموز/مشاور) یکسانه.
exports.getSupportInfo = async (request, response) => {
    return response.status(200).json({
        success: true,
        data: {
            name: configs.support.name,
            phoneNumber: configs.support.phoneNumber,
            telegramLink: `https://t.me/${configs.support.phoneNumber}`,
        }
    });
};
