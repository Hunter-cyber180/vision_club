const { UserCourses, UserWorkshops } = require("../models");

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
