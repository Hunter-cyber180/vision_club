const { Course: CourseModel, Lesson: LessonModel, Consultant: ConsultantModel } = require("../models");
const { Op } = require('sequelize');

exports.getAllCourses = async (request, response) => {
  try {
    // Getting parameters from query
    const {
      page = 1,
      limit = 9,
      sort = 'newest',
      grade = 'all',
      major = 'all',
      course_lesson_name = 'all',
      price_type = 'all',
      status = 'all', // 'in-progress' | 'finished' | 'all' — فیلتر واقعی، نه مرتب‌سازی
      approval_status = 'approved', // پیش‌فرض فقط تاییدشده‌ها (برای سایت عمومی)؛ پنل ادمین 'all' می‌فرسته تا موارد در انتظار تایید رو هم ببینه
      consultant_id, // برای پنل «کلاس‌های من» مشاور — کلاس‌های خودش با هر وضعیتی
      search = '',
    } = request.query;

    const whereConditions = {};

    if (consultant_id)
      whereConditions.consultant_id = parseInt(consultant_id);

    if (approval_status !== 'all')
      whereConditions.approval_status = approval_status;

    if (grade !== "all")
      whereConditions.grade = grade;

    if (major !== "all")
      whereConditions.major = major;

    if (course_lesson_name !== "all")
      whereConditions.course_lesson_name = course_lesson_name;

    if (status === "in-progress" || status === "finished")
      whereConditions.status = status;

    if (price_type === "free") {
      whereConditions.price = 0;
    } else if (price_type === "paid") {
      whereConditions.price = { [Op.gt]: 0 };
    }

    if (search && search.trim() !== "")
      whereConditions.title = {
        [Op.like]: `%${search.trim()}%`
      };

    let order = [];
    switch (sort) {
      case "newest":
        order = [["created_at", "DESC"]];
        break;
      case "oldest":
        order = [["created_at", "ASC"]];
        break;
      case "expensive":
        order = [["price", "DESC"]];
        break;
      case "cheapest":
        order = [["price", "ASC"]];
        break;
      default:
        order = [["created_at", "DESC"]];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // run main query
    const { count, rows: courses } = await CourseModel.findAndCountAll({
      where: whereConditions,
      order: order,
      limit: parseInt(limit),
      offset: offset,
      include: [
        {
          model: LessonModel,
          as: "lessons",
          attributes: ["id", "title", "video_url", "duration_seconds", "order_index"],
          order: [["order_index", "ASC"]], // ordering by order_index
        },
        {
          model: ConsultantModel,
          as: "consultant",
          attributes: ["id", "name", "lastname"],
        }
      ],
      distinct: true, // For correct counting with include
    });

    // Calculation of pagination information
    const totalPages = Math.ceil(count / parseInt(limit));
    const currentPage = parseInt(page);

    // main response
    return response.status(200).json({
      success: true,
      data: {
        courses,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage,
          itemsPerPage: parseInt(limit),
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
        filters: {
          grade,
          major,
          course_lesson_name,
          price_type,
          status,
          search: search || "",
        },
        sort,
      },
    });

  } catch (error) {
    return response.status(500).json({
      success: false,
      message: "Error get courses",
      error: error.message,
    });
  }
};

exports.getCourseById = async (request, response) => {
    try {
        const { id } = request.params;
        const course = await CourseModel.findByPk(id, {
            include: [
                {
                    model: LessonModel,
                    as: "lessons",
                    attributes: ["id", "title", "video_url", "duration_seconds", "order_index"],
                    order: [["order_index", "ASC"]]
                },
                {
                    model: ConsultantModel,
                    as: "consultant",
                    attributes: ["id", "name", "lastname"],
                }
            ]
        });

        if(!course)
            return response.status(404).json({
                success: false,
                message: "Course not found!"
            });

        return response.status(200).json({
            success: true,
            data: course
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error getting course!",
            error: error.message
        });
    }
};

exports.create = async (request, response) => {
    try {
        const {
            title,
            price,
            consultant_id,
            thumbnail_url,
            status,
            grade,
            major,
            course_lesson_name
        } = request.body;

        // ادمین کلاسی که خودش می‌سازه نیازی به تایید خودش نداره (approved مستقیم)؛
        // مشاور اگه کلاس بسازه، تا تایید ادمین توی سایت عمومی نشون داده نمی‌شه
        // (pending) و فقط برای مشاورِ سازنده و پنل ادمین قابل مشاهده‌ست. مشاور
        // فقط می‌تونه برای خودش کلاس بسازه (consultant_id از توکن، نه از بدنه).
        const isConsultant = request.role === "consultant";
        const finalConsultantId = isConsultant ? request.user.id : consultant_id;
        const approval_status = isConsultant ? "pending" : "approved";

        const course = await CourseModel.create({
            title,
            price: price || 0,
            consultant_id: finalConsultantId,
            thumbnail_url,
            status: status || "in-progress",
            approval_status,
            grade,
            major,
            course_lesson_name
        });

        return response.status(201).json({
            success: true,
            message: isConsultant
                ? "کلاس ثبت شد و برای بررسی و تایید برای ادمین ارسال شد."
                : "Course created.",
            data: course
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error creating course!",
            error: error.message
        });
    }
};

exports.update = async (request, response) => {
    try {
        const { id: courseId } = request.params;
        const {
            title,
            price,
            consultant_id,
            thumbnail_url,
            status,
            grade,
            major,
            course_lesson_name
        } = request.body;

        const course = await CourseModel.findByPk(courseId);
        if(!course)
            return response.status(404).json({
                success: false,
                message: "Course not found!"
            });

        if (request.role === "consultant" && course.consultant_id !== request.user.id)
            return response.status(403).json({ success: false, message: "شما فقط می‌توانید کلاس‌های خودتان را ویرایش کنید." });

        // اگه مشاور مالک کلاس داره ویرایشش می‌کنه، دوباره باید منتظر تایید ادمین بمونه
        const approvalUpdate = request.role === "consultant" ? { approval_status: "pending" } : {};

        await course.update({
            title: title || course.title,
            price: price || course.price,
            consultant_id: consultant_id || course.consultant_id,
            thumbnail_url: thumbnail_url || course.thumbnail_url,
            status: status || course.status,
            grade: grade || course.grade,
            major: major || course.major,
            course_lesson_name: course_lesson_name || course.course_lesson_name,
            ...approvalUpdate,
        });

        await course.reload({
            include: [{
                model: LessonModel,
                as: "lessons",
                attributes: ["id", "title", "video_url", "duration_seconds", "order_index"],
                order: [["order_index", "ASC"]]
            }]
        });

        return response.status(200).json({
            success: true,
            message: "Course updated.",
            data: course
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error updating course!",
            error: error.message
        });
    }
};

exports.delete = async (request, response) => {
    try {
        const { id: courseId } = request.params;
        const course = await CourseModel.findByPk(courseId);
        if(!course)
            return response.status(404).json({
                success: false,
                message: "Course not found!"
            });

        if (request.role === "consultant" && course.consultant_id !== request.user.id)
            return response.status(403).json({ success: false, message: "شما فقط می‌توانید کلاس‌های خودتان را حذف کنید." });

        await course.destroy();

        return response.status(200).json({
            success: true,
            message: "Course deleted."
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error deleting course!",
            error: error.message
        });
    }
};

exports.changeStatus = async (request, response) => {
    try {
        const { id: courseId } = request.params;
        const { status } = request.body;
        const course = await CourseModel.findByPk(courseId);
        if(!course)
            return response.status(404).json({
                success: false,
                message: "Course not found!"
            });

        if (request.role === "consultant" && course.consultant_id !== request.user.id)
            return response.status(403).json({ success: false, message: "شما فقط می‌توانید کلاس‌های خودتان را ویرایش کنید." });

        await course.update({ status });

        await course.reload({
            include: [{
                model: LessonModel,
                as: "lessons",
                attributes: ["id", "title", "video_url", "duration_seconds", "order_index"],
                order: [["order_index", "ASC"]]
            }]
        });

        return response.status(200).json({
            success: true,
            message: "Course status updated."
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error changing status!",
            error: error.message
        });
    }
};

// PATCH /courses/:id/approval -> فقط ادمین (تایید/رد کلاسی که یک مشاور ساخته)
exports.changeApprovalStatus = async (request, response) => {
    try {
        const { id: courseId } = request.params;
        const { approval_status } = request.body;

        if (!["approved", "rejected", "pending"].includes(approval_status))
            return response.status(400).json({
                success: false,
                message: "approval_status باید approved یا rejected یا pending باشد",
            });

        const course = await CourseModel.findByPk(courseId);
        if (!course)
            return response.status(404).json({ success: false, message: "Course not found!" });

        await course.update({ approval_status });

        return response.status(200).json({
            success: true,
            message: approval_status === "approved" ? "کلاس تایید شد." : approval_status === "rejected" ? "کلاس رد شد." : "وضعیت تایید بازنشانی شد.",
            data: course,
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در تغییر وضعیت تایید",
            error: error.message,
        });
    }
};
