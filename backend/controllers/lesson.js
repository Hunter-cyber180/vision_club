const { Course: CourseModel, Lesson: LessonModel } = require("../models");

exports.getCourselessons = async (request, response) => {
    try {
        const { courseId } = request.params;
        const lessons = await LessonModel.findAll({
            where: { course_id: courseId },
            include: [{
                model: CourseModel,
                as: "course"
            }],
            order: [["created_at", "DESC"]] // newest first
        });


        return response.status(200).json({
            success: true,
            data: lessons
        });

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error get lessons",
            error: error.message
        });
    }
};

exports.getLessonById = async (request, response) => {
    try {
        const { id } = request.params;
        const lesson = await LessonModel.findByPk(id, {
            include: [
                {
                    model: CourseModel,
                    as: "course",
                }
            ]
        });

        if (!lesson)
            return response.status(404).json({
                success: false,
                message: "Lesson not found!"
            });

        return response.status(200).json({
            success: true,
            data: lesson
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error get lesson!",
            error: error.message
        });
    }
};

exports.createLesson = async (request, response) => {
    try {
        const {
            course_id,
            title,
            order_index,
            duration_seconds,
            video_url
        } = request.body;

        const course = await CourseModel.findByPk(course_id);
        if (!course)
            return response.status(404).json({
                success: false,
                message: "course from course_id not found!"
            });

        if (request.role === "consultant" && course.consultant_id !== request.user.id)
            return response.status(403).json({ success: false, message: "شما فقط می‌توانید برای کلاس‌های خودتان اپیزود اضافه کنید." });

        const lesson = await LessonModel.create({
            course_id,
            title,
            order_index,
            duration_seconds,
            video_url
        });

        return response.status(201).json({
            success: true,
            message: "Lesson created successfully.",
            data: lesson
        });

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error create lesson!",
            error: error.message
        });
    }
};

exports.updateLesson = async (request, response) => {
    try {
        const { id } = request.params;
        const {
            title,
            order_index,
            duration_seconds,
            video_url
        } = request.body;

        const lesson = await LessonModel.findByPk(id);
        if (!lesson)
            return response.status(404).json({
                success: false,
                message: "Lesson not found!"
            });

        if (request.role === "consultant") {
            const course = await CourseModel.findByPk(lesson.course_id);
            if (!course || course.consultant_id !== request.user.id)
                return response.status(403).json({ success: false, message: "شما فقط می‌توانید اپیزودهای کلاس‌های خودتان را ویرایش کنید." });
        }

        await lesson.update({
            title: title || lesson.title,
            order_index: order_index || lesson.order_index,
            duration_seconds: duration_seconds || lesson.duration_seconds,
            video_url: video_url || lesson.video_url
        });

        await lesson.reload({
            include: [
                {
                    model: CourseModel,
                    as: "course",
                }
            ]
        });

        return response.status(200).json({
            success: true,
            message: "Lesson updated successfully",
            data: lesson
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error update lesson!",
            error: error.message
        });
    }
};

exports.deleteLesson = async (request, response) => {
    try {
        const { id } = request.params;
        const lesson = await LessonModel.findByPk(id);
        if (!lesson)
            return response.status(404).json({
                success: false,
                message: "Lesson not found!"
            });

        if (request.role === "consultant") {
            const course = await CourseModel.findByPk(lesson.course_id);
            if (!course || course.consultant_id !== request.user.id)
                return response.status(403).json({ success: false, message: "شما فقط می‌توانید اپیزودهای کلاس‌های خودتان را حذف کنید." });
        }

        await lesson.destroy();

        return response.status(200).json({
            success: true,
            message: "Lesson deleted successfully"
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error delete lesson",
            error: error.message
        });
    }
};
