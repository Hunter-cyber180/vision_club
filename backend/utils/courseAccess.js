const { UserCourses, UserWorkshops } = require("../models");

/**
 * آیا حساب لاگین‌شده‌ی فعلی (request.user/request.role) به محتوای این دوره
 * (جزوات و ...) دسترسی داره؟ قانون:
 *  - ادمین: همیشه بله.
 *  - مشاوری که خودش سازنده‌ی این دوره است: همیشه بله (نیازی به ثبت‌نام نیست).
 *  - کاربر عادی/دانش‌آموز (هر دو از جدول users میان): فقط اگر واقعاً در دوره
 *    ثبت‌نام کرده باشه (ردیف UserCourses داشته باشه) — چه دوره رایگان باشه
 *    چه پولی، ثبت‌نام (حتی رایگان) شرط لازمه.
 */
async function hasCourseAccess(request, course) {
    if (!request.role || !request.user) return false;
    if (request.role === "admin") return true;
    if (request.role === "consultant") return course.consultant_id === request.user.id;
    if (request.role === "user") {
        const enrollment = await UserCourses.findOne({
            where: { user_id: request.user.id, course_id: course.id },
        });
        return !!enrollment;
    }
    return false;
}

/**
 * همون منطق برای کارگاه‌ها، با یک تفاوت آگاهانه: برخلاف دوره‌ها (که هر
 * مشاوری فقط به دوره‌ی خودش دسترسی مستقیم داره)، طبق درخواست صریح کارفرما،
 * برای کارگاه‌ها هر مشاور و هر ادمینی به تمام کارگاه‌ها (حتی کارگاه‌های
 * مشاورهای دیگه) دسترسی رایگان داره و نیازی به ثبت‌نام نیست.
 */
async function hasWorkshopAccess(request, workshop) {
    if (!request.role || !request.user) return false;
    if (request.role === "admin") return true;
    if (request.role === "consultant") return true;
    if (request.role === "user") {
        const enrollment = await UserWorkshops.findOne({
            where: { user_id: request.user.id, workshop_id: workshop.id },
        });
        return !!enrollment;
    }
    return false;
}

module.exports = { hasCourseAccess, hasWorkshopAccess };
