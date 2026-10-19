const { CourseNote, Course } = require("../models");
const { hasCourseAccess } = require("../utils/courseAccess");

// GET /courses/:courseId/notes -> لیست جزوات همیشه نشون داده می‌شه (تا کاربر
// بدونه این دوره جزوه داره) ولی اگه کسی هنوز در دوره ثبت‌نام نکرده (و مشاورِ
// سازنده‌ی دوره یا ادمین هم نیست)، لینک دانلود واقعی (file_url) حذف می‌شه و
// به‌جاش با یه پرچم locked:true مشخص می‌شه — قبلاً کل بخش جزوات حذف می‌شد که
// طبق فیدبک درست نبود، باید قفل با آیکون دیده بشه نه غیب.
exports.getByCourse = async (request, response) => {
    try {
        const { courseId } = request.params;
        const course = await Course.findByPk(courseId);
        if (!course)
            return response.status(404).json({ success: false, message: "دوره یافت نشد!" });

        const allowed = await hasCourseAccess(request, course);

        const notes = await CourseNote.findAll({
            where: { course_id: courseId },
            order: [["created_at", "DESC"]],
        });

        const data = notes.map((n) => {
            const plain = n.toJSON();
            if (allowed) return { ...plain, locked: false };
            return { ...plain, file_url: null, locked: true };
        });

        return response.status(200).json({ success: true, data, access: allowed });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت جزوات دوره",
            error: error.message,
        });
    }
};

// POST /courses/:courseId/notes -> ادمین برای هر دوره‌ای، مشاور فقط برای دوره‌های خودش
exports.create = async (request, response) => {
    try {
        const { courseId } = request.params;
        const { title, file_url } = request.body;

        if (!title || !file_url)
            return response.status(400).json({ success: false, message: "عنوان و لینک فایل جزوه الزامی است" });

        const course = await Course.findByPk(courseId);
        if (!course)
            return response.status(404).json({ success: false, message: "دوره یافت نشد!" });

        if (request.role === "consultant" && course.consultant_id !== request.user.id)
            return response.status(403).json({ success: false, message: "شما فقط می‌توانید برای کلاس‌های خودتان جزوه اضافه کنید." });

        const note = await CourseNote.create({ course_id: courseId, title, file_url });

        return response.status(201).json({ success: true, message: "جزوه اضافه شد.", data: note });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در افزودن جزوه",
            error: error.message,
        });
    }
};

// DELETE /courses/notes/:id -> ادمین برای هر جزوه‌ای، مشاور فقط برای جزوات دوره‌های خودش
exports.remove = async (request, response) => {
    try {
        const { id } = request.params;
        const note = await CourseNote.findByPk(id);
        if (!note)
            return response.status(404).json({ success: false, message: "جزوه یافت نشد!" });

        if (request.role === "consultant") {
            const course = await Course.findByPk(note.course_id);
            if (!course || course.consultant_id !== request.user.id)
                return response.status(403).json({ success: false, message: "شما فقط می‌توانید جزوات کلاس‌های خودتان را حذف کنید." });
        }

        await note.destroy();
        return response.status(200).json({ success: true, message: "جزوه حذف شد." });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در حذف جزوه",
            error: error.message,
        });
    }
};
