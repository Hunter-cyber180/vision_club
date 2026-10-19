const { Charge: ChargeModel, User: UserModel } = require("../../models");

exports.updateCharge = async (request, response) => {
    try {
        const { userId, amount } = request.body;
        const user = await UserModel.findByPk(userId);
        if (!user)
            return response.status(404).json({
                success: false,
                message: "User not found!"
            });
        
        await user.update({ charge_amount: amount });

        return response.status(200).json({
            success: true,
            message: "User charge amount updated."
        });

    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error reducing user charge",
            error: error.message
        });
    }
}

exports.reduceCharge = async (request, response) => {
    try {
        const user = request.user;
        const { reduce_amount } = request.body;

        if (reduce_amount > user.charge_amount)
            return response.status(400).json({
                success: false,
                message: "User charge is not enough!"
            });

        await user.update({
            charge_amount: user.charge_amount - reduce_amount
        });

        return response.status(200).json({
            success: true,
            message: "User charge reduced."
        });

    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error reducing user charge",
            error: error.message
        });
    };
};
