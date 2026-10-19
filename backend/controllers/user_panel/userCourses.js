const { UserCourses: UserCoursesModel, Course: CourseModel, User: UserModel, Lesson: LessonModel, Consultant: ConsultantModel } = require("../../models");

exports.create = async (request, response) => {
    try {
        const { user_id, course_id, last_lesson_id, status } = request.body;
        const user = await UserModel.findByPk(user_id);
        const course = await CourseModel.findByPk(course_id);
        const lesson = await LessonModel.findByPk(last_lesson_id);

        if (!user)
            return response.status(404).json({
                success: false,
                message: "User not found!"
            });

        if (!course)
            return response.status(404).json({
                success: false,
                message: "Course not found!"
            });

        if (!lesson)
            return response.status(404).json({
                success: false,
                message: "Lesson not found!"
            });

        const userCourse = await UserCoursesModel
            .create({user_id, course_id, last_lesson_id, status});
        

        return response.status(201).json({
            success: true,
            data: userCourse
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error creating user course!",
            error: error.message
        });
    }
}

// POST /user-panel/user-courses/purchase -> ثبت‌نام خودکار دانش‌آموز در یک دوره
// (رایگان: فوری؛ پولی: با کسر از موجودی کیف پول کاربر)
exports.purchase = async (request, response) => {
    try {
        const user = request.user; // authenticateAccessToken("user")
        const { course_id } = request.body;

        const course = await CourseModel.findByPk(course_id, {
            include: [{ model: LessonModel, as: "lessons", order: [["order_index", "ASC"]] }]
        });
        if (!course)
            return response.status(404).json({ success: false, message: "دوره یافت نشد!" });

        const existing = await UserCoursesModel.findOne({ where: { user_id: user.id, course_id } });
        if (existing)
            return response.status(409).json({ success: false, message: "قبلاً در این دوره ثبت‌نام کرده‌ای." });

        // دانش‌آموزهایی که مشاور پذیرفتتشون (role=student) به همه‌ی دوره‌ها به‌صورت
        // «رایگان برای اعضای ویژه» دسترسی دارن؛ فقط کاربر عادی (role=user) پول کسر می‌شه.
        const price = user.role === "student" ? 0 : (course.price || 0);
        if (price > 0) {
            if (user.charge_amount < price)
                return response.status(400).json({
                    success: false,
                    message: "موجودی کیف پول کافی نیست. لطفاً ابتدا کیف پولت رو شارژ کن.",
                });
            await user.update({ charge_amount: user.charge_amount - price });
        }

        const firstLesson = (course.lessons || [])[0];
        if (!firstLesson)
            return response.status(400).json({ success: false, message: "این دوره هنوز درسی نداره." });

        const userCourse = await UserCoursesModel.create({
            user_id: user.id,
            course_id,
            last_lesson_id: firstLesson.id,
            status: "in-progress",
        });

        return response.status(201).json({
            success: true,
            message: "ثبت‌نام در دوره با موفقیت انجام شد.",
            data: userCourse,
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در ثبت‌نام دوره!",
            error: error.message
        });
    }
}

exports.getAllByUser = async (request, response) => {
    try {
        const { user_id } = request.params;

        if (!user_id)
            return response.status(400).json({
                success: false,
                message: "user_id is required!"
            });

        const userCourses = await UserCoursesModel.findAll({
            where: { user_id },
            include: [
                {
                    model: CourseModel,
                    as: "course",
                    include: [
                        { model: LessonModel, as: "lessons", attributes: ["id", "title", "order_index", "duration_seconds"] },
                        { model: ConsultantModel, as: "consultant", attributes: ["id", "name", "lastname"] },
                    ]
                },
                { model: LessonModel, as: "lastLesson", attributes: ["id", "title", "order_index"] },
            ],
            order: [["created_at", "DESC"]]
        });

        return response.status(200).json({
            success: true,
            data: userCourses
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error get user courses!",
            error: error.message
        });
    }
}

exports.getOne = async (request, response) => {
    
    try {
        const { id } = request.params;
        const userCourse = await UserCoursesModel.findByPk(id,
        {
            include: [{
                model: CourseModel,
                as: "course"
            }]
        });

        if (!userCourse)
            return response.status(404).json({
                success: false,
                message: "User course not found!"
            });

        return response.status(200).json({
            success: true,
            data: userCourse
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error get user course!",
            error: error.message
        });
    }
}

exports.update = async (request, response) => {
    try {
        const { id } = request.params;
        const { user_id, course_id, last_lesson_id, status } = request.body;

        const userCourse = await UserCoursesModel.findByPk(id);

        if (!userCourse)
            return response.status(404).json({
                success: false,
                message: "User course not found!"
            });

        await userCourse.update({
            user_id: user_id || userCourse.user_id,
            course_id: course_id || userCourse.course_id,
            last_lesson_id: last_lesson_id || userCourse.last_lesson_id,
            status: status || userCourse.status,
        });

        return response.status(200).json({
            success: true,
            message: "User course updated successfully.",
            data: userCourse
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error updating user course!",
            error: error.message
        });
    }
}

exports.delete = async (request, response) => {
    try {
        const { id } = request.params;
        const userCourse = await UserCoursesModel.findByPk(id);

        if (!userCourse)
            return response.status(404).json({
                success: false,
                message: "User Course not found!"
            });

        await userCourse.destroy();
        return response.status(200).json({
            success: true,
            message: "User course deleted successfully."
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error deleting user course!",
            error: error.message
        });
    }
}

exports.updateStatus = async (request, response) => {
    try {
        const { id } = request.params;
        const { status } = request.body;

        if (!status || !["in-progress", "completed"].includes(status))
            return response.status(400).json({ 
                success: false, 
                message: "Status must be 'in-progress' or 'completed'" 
            });

        const userCourse = await UserCoursesModel.findByPk(id);

        if (!userCourse)
            return response.status(404).json({
                success: false,
                message: "User course not found!"
            });

        await userCourse.update({ status });
        return response.status(200).json({
            success: true,
            message: "Staus updated successfully.",
            data: userCourse
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error updating status!",
            error: error.message
        });
    }
}

exports.updateLastLesson = async (request, response) => {
    try {
        const { id } = request.params;
        const { last_lesson_id } = request.body;

        if (!last_lesson_id)
            return response.status(400).json({ 
                success: false, 
                message: "last_lesson_id is required" 
            });

        const userCourse = await UserCoursesModel.findByPk(id);
        if (!userCourse)
            return response.status(404).json({
                success: false,
                message: "User course not found!"
            });

        await userCourse.update({ last_lesson_id });
        return response.status(200).json({
            success: true,
            message: "last_lesson_id updated successfully.",
            data: userCourse
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error updating last_user_id!",
            error: error.message
        });
    }
}
