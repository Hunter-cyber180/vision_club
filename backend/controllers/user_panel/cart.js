const {
    CartItem, Course, Workshop, UserCourses, UserWorkshops, Consultant, Category,
} = require("../../models");

async function serializeCartItems(items, user) {
    const courseIds = items.filter((i) => i.item_type === "course").map((i) => i.item_id);
    const workshopIds = items.filter((i) => i.item_type === "workshop").map((i) => i.item_id);

    const [courses, workshops] = await Promise.all([
        courseIds.length
            ? Course.findAll({ where: { id: courseIds }, include: [{ model: Consultant, as: "consultant", attributes: ["id", "name", "lastname"] }] })
            : [],
        workshopIds.length
            ? Workshop.findAll({ where: { id: workshopIds }, include: [{ model: Category, as: "category", attributes: ["id", "name"] }] })
            : [],
    ]);
    const courseMap = new Map(courses.map((c) => [c.id, c]));
    const workshopMap = new Map(workshops.map((w) => [w.id, w]));

    const isFreeForRole = user.role === "student";

    return items
        .map((item) => {
            const product = item.item_type === "course" ? courseMap.get(item.item_id) : workshopMap.get(item.item_id);
            if (!product) return null;
            const rawPrice = product.price || 0;
            const effectivePrice = isFreeForRole ? 0 : rawPrice;
            return {
                cart_item_id: item.id,
                item_type: item.item_type,
                item_id: item.item_id,
                title: product.title,
                price: effectivePrice,
                original_price: rawPrice,
                thumbnail: item.item_type === "course" ? product.thumbnail_url : product.video_thumbnail,
                meta: item.item_type === "course"
                    ? (product.consultant ? `${product.consultant.name} ${product.consultant.lastname}` : "بدون مدرس مشخص")
                    : (product.category ? product.category.name : "کارگاه"),
            };
        })
        .filter(Boolean);
}

exports.getCart = async (request, response) => {
    try {
        const user = request.user;
        const items = await CartItem.findAll({ where: { user_id: user.id }, order: [["created_at", "DESC"]] });
        const serialized = await serializeCartItems(items, user);
        const total = serialized.reduce((sum, i) => sum + i.price, 0);

        return response.status(200).json({ success: true, data: { items: serialized, total } });
    } catch (error) {
        return response.status(500).json({ success: false, message: "خطا در دریافت سبد خرید", error: error.message });
    }
};

exports.addToCart = async (request, response) => {
    try {
        const user = request.user;
        const { item_type, item_id } = request.body;

        if (!["course", "workshop"].includes(item_type) || !item_id)
            return response.status(400).json({ success: false, message: "نوع یا شناسه‌ی آیتم نامعتبر است." });

        const product = item_type === "course" ? await Course.findByPk(item_id) : await Workshop.findByPk(item_id);
        if (!product)
            return response.status(404).json({ success: false, message: "این دوره/کارگاه پیدا نشد." });

        const EnrollModel = item_type === "course" ? UserCourses : UserWorkshops;
        const enrollWhere = item_type === "course" ? { user_id: user.id, course_id: item_id } : { user_id: user.id, workshop_id: item_id };
        const alreadyEnrolled = await EnrollModel.findOne({ where: enrollWhere });
        if (alreadyEnrolled)
            return response.status(409).json({ success: false, message: "قبلاً در این مورد ثبت‌نام کرده‌ای." });

        const [cartItem, created] = await CartItem.findOrCreate({
            where: { user_id: user.id, item_type, item_id },
            defaults: { user_id: user.id, item_type, item_id },
        });

        return response.status(created ? 201 : 200).json({
            success: true,
            message: created ? "به سبد خرید اضافه شد." : "این مورد از قبل توی سبد خریدته.",
            data: cartItem,
        });
    } catch (error) {
        return response.status(500).json({ success: false, message: "خطا در افزودن به سبد خرید", error: error.message });
    }
};

exports.removeFromCart = async (request, response) => {
    try {
        const user = request.user;
        const { id } = request.params;
        const cartItem = await CartItem.findOne({ where: { id, user_id: user.id } });
        if (!cartItem)
            return response.status(404).json({ success: false, message: "این آیتم توی سبد خریدت نیست." });

        await cartItem.destroy();
        return response.status(200).json({ success: true, message: "از سبد خرید حذف شد." });
    } catch (error) {
        return response.status(500).json({ success: false, message: "خطا در حذف از سبد خرید", error: error.message });
    }
};

exports.checkout = async (request, response) => {
    try {
        const user = request.user;
        const items = await CartItem.findAll({ where: { user_id: user.id } });
        if (!items.length)
            return response.status(400).json({ success: false, message: "سبد خریدت خالیه." });

        const serialized = await serializeCartItems(items, user);
        if (!serialized.length) {
            await CartItem.destroy({ where: { user_id: user.id } });
            return response.status(400).json({ success: false, message: "دوره/کارگاه‌های داخل سبدت دیگه در دسترس نیستن." });
        }

        const total = serialized.reduce((sum, i) => sum + i.price, 0);
        if (total > 0 && user.charge_amount < total)
            return response.status(400).json({ success: false, message: "موجودی کیف پول کافی نیست. لطفاً ابتدا کیف پولت رو شارژ کن." });

        if (total > 0) {
            await user.update({ charge_amount: user.charge_amount - total });
        }

        for (const entry of serialized) {
            if (entry.item_type === "course") {
                const existing = await UserCourses.findOne({ where: { user_id: user.id, course_id: entry.item_id } });
                if (existing) continue;
                const course = await Course.findByPk(entry.item_id, { include: [{ association: "lessons" }] });
                const firstLesson = (course?.lessons || [])[0];
                if (!firstLesson) continue;
                await UserCourses.create({ user_id: user.id, course_id: entry.item_id, last_lesson_id: firstLesson.id, status: "in-progress" });
            } else {
                const existing = await UserWorkshops.findOne({ where: { user_id: user.id, workshop_id: entry.item_id } });
                if (existing) continue;
                await UserWorkshops.create({ user_id: user.id, workshop_id: entry.item_id, status: "in-progress" });
            }
        }

        await CartItem.destroy({ where: { user_id: user.id } });

        return response.status(200).json({ success: true, message: "خرید با موفقیت انجام شد.", data: { paid: total } });
    } catch (error) {
        return response.status(500).json({ success: false, message: "خطا در پرداخت سبد خرید", error: error.message });
    }
};
