const { Workshop, Category, Consultant } = require("../models");
const { Op } = require("sequelize");

const getAllWorkshops = async (request, response) => {
    try {
        // 1. دریافت پارامترهای فیلتر از query string
        const {
            search, category_id, price_type, is_active,
            consultant_id, // برای پنل «کارگاه‌های من» مشاور — کارگاه‌های خودش با هر وضعیتی
            approval_status = "approved", // پیش‌فرض فقط تاییدشده‌ها (سایت عمومی)؛ پنل مشاور/ادمین 'all' می‌فرسته
            page = 1, limit = 9, sort = "newest",
        } = request.query;

        // 2. ساخت شرط WHERE
        const whereClause = {};

        if (consultant_id)
            whereClause.consultant_id = parseInt(consultant_id);

        if (approval_status !== "all")
            whereClause.approval_status = approval_status;

        // فیلتر بر اساس جستجو در title یا description
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        // فیلتر بر اساس دسته‌بندی
        if (category_id)
            whereClause.category_id = parseInt(category_id);

        // فیلتر بر اساس نوع قیمت (رایگان یا پولی)
        if (price_type) {
            if (price_type === "free") {
                whereClause.price = 0; // رایگان
            } else if (price_type === "paid") {
                whereClause.price = { [Op.gt]: 0 }; // پولی (بزرگتر از ۰)
            }
        }

        // فیلتر بر اساس وضعیت فعال بودن (پیش‌فرض فقط فعال‌ها، برای سایت عمومی)
        if (is_active === undefined || is_active === "all") {
            if (is_active === undefined) whereClause.is_active = true;
        } else {
            whereClause.is_active = is_active === "true" || is_active === "1";
        }

        // 3. مرتب‌سازی
        let order;
        switch (sort) {
            case "oldest": order = [["created_at", "ASC"]]; break;
            case "priceHigh": order = [["price", "DESC"]]; break;
            case "priceLow": order = [["price", "ASC"]]; break;
            default: order = [["created_at", "DESC"]];
        }

        // 4. صفحه‌بندی
        const parsedLimit = parseInt(limit) || 9;
        const parsedPage = parseInt(page) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        // 5. اجرای کوئری با JOIN به جدول category
        const { count, rows: workshops } = await Workshop.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Category,
                    as: "category",
                    attributes: ["id", "name", "is_active"] // فقط فیلدهای مورد نیاز
                },
                {
                    model: Consultant,
                    as: "consultant",
                    attributes: ["id", "name", "lastname"],
                    required: false,
                },
            ],
            order,
            limit: parsedLimit,
            offset,
            distinct: true,
        });

        const totalPages = Math.ceil(count / parsedLimit) || 1;

        response.status(200).json({
            success: true,
            count: workshops.length,
            data: workshops,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: parsedPage,
                itemsPerPage: parsedLimit,
                hasNextPage: parsedPage < totalPages,
                hasPrevPage: parsedPage > 1,
            },
        });

    } catch (error) {
        response.status(500).json({
            success: false,
            message: "Error get workshops",
            error: error.message
        });
    }
};

// ==================== GET ONE ====================
const getWorkshopById = async (request, response) => {
    try {
        const { id } = request.params;
        const workshop = await Workshop.findByPk(id, {
            include: [
                {
                    model: Category,
                    as: "category",
                    attributes: ["id", "name"]
                }
            ]
        });

        if (!workshop)
            return response.status(404).json({
                success: false,
                message: "Workshop not found!"
            });

        response.status(200).json({
            success: true,
            data: workshop
        });
    } catch (error) {
        response.status(500).json({
            success: false,
            message: "Error get workshop!",
            error: error.message
        });
    }
};

// ==================== CREATE ====================
const createWorkshop = async (request, response) => {
    try {
        const {
            title,
            description,
            duration_minutes,
            instructor_name,
            video_url,
            video_thumbnail,
            price,
            is_active,
            category_id,
            consultant_id,
        } = request.body;

        const category = await Category.findByPk(category_id);
        if (!category)
            return response.status(404).json({
                success: false,
                message: "دسته‌بندی انتخاب‌شده پیدا نشد."
            });

        // اگه مشاور خودش کارگاه می‌سازه، فقط می‌تونه برای خودش بسازه (consultant_id
        // از توکن، نه از بدنه) — دقیقاً مثل ساخت دوره؛ ادمین می‌تونه اختیاری یک
        // مشاور رو به‌عنوان سازنده مشخص کنه.
        const isConsultant = request.role === "consultant";
        const finalConsultantId = isConsultant ? request.user.id : (consultant_id || null);
        // دقیقاً مثل دوره‌ها: کارگاهی که مشاور می‌سازه تا تایید ادمین pending
        // می‌مونه (توی سایت عمومی دیده نمی‌شه)؛ کارگاه ادمین مستقیم approved.
        const approval_status = isConsultant ? "pending" : "approved";

        const workshop = await Workshop.create({
            title,
            description,
            duration_minutes: duration_minutes,
            instructor_name: instructor_name,
            video_url,
            video_thumbnail,
            price: price || 0,
            is_active: is_active !== undefined ? is_active : true,
            category_id,
            consultant_id: finalConsultantId,
            approval_status,
        });

        response.status(201).json({
            success: true,
            message: isConsultant
                ? "کارگاه ثبت شد و برای بررسی و تایید برای ادمین ارسال شد."
                : "Workshop created successfully.",
            data: workshop
        });

    } catch (error) {
        // خطاهای اعتبارسنجی سطح دیتابیس (مثلاً یک فیلد NOT NULL خالی مونده) رو
        // به‌جای پیام مبهم عمومی، دقیقاً همون چیزی که اشتباهه نشون می‌دیم.
        const message = error.name === "SequelizeValidationError"
            ? error.errors.map((e) => e.message).join("، ")
            : "ذخیره‌ی کارگاه با خطا مواجه شد.";
        response.status(500).json({
            success: false,
            message,
            error: error.message
        });
    }
};

// ==================== UPDATE ====================
const updateWorkshop = async (request, response) => {
    try {
        const { id } = request.params;
        const {
            title,
            description,
            duration_minutes,
            instructor_name,
            video_url,
            video_thumbnail,
            price,
            is_active,
            category_id
        } = request.body;

        const workshop = await Workshop.findByPk(id);
        if (!workshop)
            return response.status(404).json({
                success: false,
                message: "Workshop not found!"
            });

        if (request.role === "consultant" && workshop.consultant_id !== request.user.id)
            return response.status(403).json({ success: false, message: "شما فقط می‌توانید کارگاه‌های خودتان را ویرایش کنید." });

        // اگر category_id تغییر کرده، بررسی وجود دسته‌بندی جدید
        if (category_id && category_id !== workshop.category_id) {
            const category = await Category.findByPk(category_id);
            if (!category)
                return response.status(404).json({
                    success: false,
                    message: "Category not found"
                });
        }

        // اگه مشاورِ مالک، کارگاه تاییدشده‌ای رو ویرایش کنه، دوباره باید منتظر
        // تایید ادمین بمونه — دقیقاً مثل ویرایش کلاس توسط مشاور.
        const approvalUpdate = request.role === "consultant" ? { approval_status: "pending" } : {};

        // به‌روزرسانی
        await workshop.update({
            title: title || workshop.title,
            description: description || workshop.description,
            duration_minutes: duration_minutes || workshop.duration_minutes,
            instructor_name: instructor_name || workshop.instructor_name,
            video_url: video_url || workshop.video_url,
            video_thumbnail: video_thumbnail || workshop.video_thumbnail,
            price: price !== undefined ? price : workshop.price,
            is_active: is_active !== undefined ? is_active : workshop.is_active,
            category_id: category_id || workshop.category_id,
            ...approvalUpdate,
        });

        // بارگذاری مجدد با ارتباطات
        await workshop.reload({
            include: [
                {
                    model: Category,
                    as: "category",
                    attributes: ["id", "name"]
                }
            ]
        });

        response.status(200).json({
            success: true,
            message: "Workshop updated successfully",
            data: workshop
        });
    } catch (error) {
        response.status(500).json({
            success: false,
            message: "Error update workshop!",
            error: error.message
        });
    }
};

// ==================== DELETE ====================
const deleteWorkshop = async (request, response) => {
    try {
        const { id } = request.params;
        const workshop = await Workshop.findByPk(id);
        if (!workshop)
            return response.status(404).json({
                success: false,
                message: "workshop not found!"
            });

        if (request.role === "consultant" && workshop.consultant_id !== request.user.id)
            return response.status(403).json({ success: false, message: "شما فقط می‌توانید کارگاه‌های خودتان را حذف کنید." });

        // حذف فیزیکی (اگر می‌خواهید نرم‌افزاری باشد، بعداً توضیح می‌دم)
        await workshop.destroy();

        response.status(200).json({
            success: true,
            message: "Workshop deleted successfully"
        });
    } catch (error) {
        response.status(500).json({
            success: false,
            message: "Error delete workshop",
            error: error.message
        });
    }
};

// ==================== TOGGLE ACTIVE ====================
const toggleWorkshopActive = async (request, response) => {
    try {
        const { id } = request.params;
        const workshop = await Workshop.findByPk(id);
        if (!workshop)
            return response.status(404).json({
                success: false,
                message: "Workshop not found!"
            });

        if (request.role === "consultant" && workshop.consultant_id !== request.user.id)
            return response.status(403).json({ success: false, message: "شما فقط می‌توانید کارگاه‌های خودتان را تغییر وضعیت دهید." });

        // تغییر وضعیت فعال/غیرفعال
        await workshop.update({
            is_active: !workshop.is_active
        });

        response.status(200).json({
            success: true,
            message: `Workshop ${workshop.is_active ? "active" : "inactive"}ed`,
            data: {
                id: workshop.id,
                is_active: workshop.is_active
            }
        });

    } catch (error) {
        response.status(500).json({
            success: false,
            message: "Error in status change!",
            error: error.message
        });
    }
};

// ==================== CHANGE APPROVAL STATUS ====================
// PATCH /workshops/:id/approval -> فقط ادمین (تایید/رد کارگاهی که یک مشاور ساخته)
const changeApprovalStatus = async (request, response) => {
    try {
        const { id } = request.params;
        const { approval_status } = request.body;

        if (!["approved", "rejected", "pending"].includes(approval_status))
            return response.status(400).json({
                success: false,
                message: "approval_status باید approved یا rejected یا pending باشد",
            });

        const workshop = await Workshop.findByPk(id);
        if (!workshop)
            return response.status(404).json({ success: false, message: "Workshop not found!" });

        await workshop.update({ approval_status });

        return response.status(200).json({
            success: true,
            message: approval_status === "approved" ? "کارگاه تایید شد." : approval_status === "rejected" ? "کارگاه رد شد." : "وضعیت تایید بازنشانی شد.",
            data: workshop,
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در تغییر وضعیت تایید",
            error: error.message,
        });
    }
};

module.exports = {
    getAllWorkshops,
    getWorkshopById,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    toggleWorkshopActive,
    changeApprovalStatus,
};
