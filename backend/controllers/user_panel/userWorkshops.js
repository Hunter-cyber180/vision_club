const { UserWorkshops: UserWorkshopsModel, Workshop: WorkshopModel, User: UserModel } = require("../../models");

exports.create = async (request, response) => {
    try {
        const { user_id, workshop_id, status } = request.body;
        const user = await UserModel.findByPk(user_id);
        const workshop = await WorkshopModel.findByPk(workshop_id);

        if (!user)
            return response.status(404).json({
                success: false,
                message: "User not found!"
            });

        if (!workshop)
            return response.status(404).json({
                success: false,
                message: "Workshop not found!"
            });

        const userWorkshop = await UserWorkshopsModel
            .create({user_id, workshop_id, status});

        return response.status(201).json({
            success: true,
            data: userWorkshop
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error creating user workshop!",
            error: error.message
        });
    }
}

// POST /user-panel/user-workshops/purchase -> ثبت‌نام خودکار دانش‌آموز در یک کارگاه
exports.purchase = async (request, response) => {
    try {
        const user = request.user; // authenticateAccessToken("user")
        const { workshop_id } = request.body;

        const workshop = await WorkshopModel.findByPk(workshop_id);
        if (!workshop)
            return response.status(404).json({ success: false, message: "کارگاه یافت نشد!" });

        const existing = await UserWorkshopsModel.findOne({ where: { user_id: user.id, workshop_id } });
        if (existing)
            return response.status(409).json({ success: false, message: "قبلاً در این کارگاه ثبت‌نام کرده‌ای." });

        // دانش‌آموزها (role=student) رایگان و بی‌واسطه دسترسی دارن؛ فقط کاربر عادی پول کسر می‌شه.
        const price = user.role === "student" ? 0 : (workshop.price || 0);
        if (price > 0) {
            if (user.charge_amount < price)
                return response.status(400).json({
                    success: false,
                    message: "موجودی کیف پول کافی نیست. لطفاً ابتدا کیف پولت رو شارژ کن.",
                });
            await user.update({ charge_amount: user.charge_amount - price });
        }

        const userWorkshop = await UserWorkshopsModel.create({
            user_id: user.id,
            workshop_id,
            status: "in-progress",
        });

        return response.status(201).json({
            success: true,
            message: "ثبت‌نام در کارگاه با موفقیت انجام شد.",
            data: userWorkshop,
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در ثبت‌نام کارگاه!",
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

        const userWorkshops = await UserWorkshopsModel.findAll({
            where: { user_id },
            include: [{
                model: WorkshopModel,
                as: "workshop"
            }],
            order: [["created_at", "DESC"]]
        });

        return response.status(200).json({
            success: true,
            data: userWorkshops
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error get user workshops!",
            error: error.message
        });
    }
}

exports.getOne = async (request, response) => {
    
    try {
        const { id } = request.params;
        const userWorkshop = await UserWorkshopsModel.findByPk(id,
        {
            include: [{
                model: WorkshopModel,
                as: "workshop"
            }]
        });

        if (!userWorkshop)
            return response.status(404).json({
                success: false,
                message: "User workshop not found!"
            });

        return response.status(200).json({
            success: true,
            data: userWorkshop
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error get user workshop!",
            error: error.message
        });
    }
}

exports.update = async (request, response) => {
    try {
        const { id } = request.params;
        const { user_id, workshop_id, status } = request.body;

        const userWorkshop = await UserWorkshopsModel.findByPk(id);

        if (!userWorkshop)
            return response.status(404).json({
                success: false,
                message: "User course not found!"
            });

        await userWorkshop.update({
            user_id: user_id || userWorkshop.user_id,
            workshop_id: workshop_id || userWorkshop.workshop_id,
            status: status || userWorkshop.status,
        });

        return response.status(200).json({
            success: true,
            message: "User workshop updated successfully.",
            data: userWorkshop
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error updating user workshop!",
            error: error.message
        });
    }
}

exports.delete = async (request, response) => {
    try {
        const { id } = request.params;
        const userWorkshop = await UserWorkshopsModel.findByPk(id);

        if (!userWorkshop)
            return response.status(404).json({
                success: false,
                message: "User workshop not found!"
            });

        await userWorkshop.destroy();
        return response.status(200).json({
            success: true,
            message: "User workshop deleted successfully."
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error deleting user workshop!",
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

        const userWorkshop = await UserWorkshopsModel.findByPk(id);

        if (!userWorkshop)
            return response.status(404).json({
                success: false,
                message: "User workshop not found!"
            });

        await userWorkshop.update({ status });
        return response.status(200).json({
            success: true,
            message: "Staus updated successfully.",
            data: userWorkshop
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error updating status!",
            error: error.message
        });
    }
}
