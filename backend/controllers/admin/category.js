const { Category, Workshop } = require("../../models");

exports.getAll = async (request, response) => {
    try {
        const categories = await Category.findAll({ order: [["id", "ASC"]] });
        return response.status(200).json({ success: true, data: categories });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت دسته‌بندی‌ها",
            error: error.message
        });
    }
};

exports.create = async (request, response) => {
    try {
        const { name, is_active } = request.body;
        if (!name)
            return response.status(400).json({ success: false, message: "نام دسته‌بندی الزامی است" });

        const category = await Category.create({ name, is_active: is_active ?? true });
        return response.status(201).json({ success: true, data: category });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در ساخت دسته‌بندی",
            error: error.message
        });
    }
};

exports.update = async (request, response) => {
    try {
        const { id } = request.params;
        const { name, is_active } = request.body;

        const category = await Category.findByPk(id);
        if (!category)
            return response.status(404).json({ success: false, message: "دسته‌بندی یافت نشد!" });

        await category.update({
            name: name ?? category.name,
            is_active: is_active ?? category.is_active,
        });

        return response.status(200).json({ success: true, data: category });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در به‌روزرسانی دسته‌بندی",
            error: error.message
        });
    }
};

exports.remove = async (request, response) => {
    try {
        const { id } = request.params;
        const category = await Category.findByPk(id);
        if (!category)
            return response.status(404).json({ success: false, message: "دسته‌بندی یافت نشد!" });

        const workshopCount = await Workshop.count({ where: { category_id: id } });
        if (workshopCount > 0)
            return response.status(400).json({
                success: false,
                message: "این دسته‌بندی دارای کارگاه است و قابل حذف نیست"
            });

        await category.destroy();
        return response.status(200).json({ success: true, message: "دسته‌بندی حذف شد." });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در حذف دسته‌بندی",
            error: error.message
        });
    }
};
