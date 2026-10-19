const { Option: OptionModel, Question: QuestionModel, sequelize } = require("../models");

exports.addOption = async (request, response) => {
    try {
        const { questionId } = request.params;
        const { option_text, is_correct, order_number } = request.body;

        const question = await QuestionModel.findByPk(questionId);
        if (!question)
            return response.status(404).json({ success: false, message: "سوال یافت نشد!" });

        const lastOption = await OptionModel.findOne({
            where: { question_id: questionId },
            order: [['order_number', 'DESC']]
        });

        const option = await OptionModel.create({
            question_id: questionId,
            option_text,
            is_correct: is_correct || false,
            order_number: order_number || (lastOption ? lastOption.order_number + 1 : 1)
        });

        return response.status(201).json({ success: true, data: option });

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error creating option",
            error: error.message
        });
    }
}

exports.addMultipleOptions = async (request, response) => {
    const transaction = await sequelize.transaction();
    try {
        const { questionId } = request.params;
        const { options } = request.body;

        if (!options || !Array.isArray(options) || options.length < 2) {
            await transaction.rollback();
            return response.status(400).json({
                success: false,
                message: 'حداقل ۲ گزینه باید ارسال شود'
            });
        }

        const question = await QuestionModel.findByPk(questionId);
        if (!question) {
            await transaction.rollback();
            return response.status(404).json({ success: false, message: "سوال یافت نشد!" });
        }

        const createdOptions = [];

        for (let i = 0; i < options.length; i++) {
            const oData = options[i];

            const option = await OptionModel.create({
                question_id: questionId,
                option_text: oData.option_text,
                is_correct: oData.is_correct || false,
                order_number: oData.order_number || (i + 1)
            }, { transaction });

            createdOptions.push(option);
        }

        const hasCorrectOption = createdOptions.some(opt => opt.is_correct === true);
        if (!hasCorrectOption)
            throw new Error("حداقل یکی از گزینه‌ها باید صحیح باشد");

        await transaction.commit();

        return response.status(201).json({ success: true, data: createdOptions });

    } catch (error) {
        await transaction.rollback();
        return response.status(500).json({
            success: false,
            message: "Error creating options",
            error: error.message
        });
    }
}

exports.updateOption = async (request, response) => {
    try {
        const { id } = request.params;
        const { option_text, is_correct, order_number } = request.body;

        const option = await OptionModel.findByPk(id);
        if (!option)
            return response.status(404).json({
                success: false,
                message: "Option not found!"
            });

        await option.update({
            option_text: option_text || option.option_text,
            is_correct: is_correct !== undefined ? is_correct : option.is_correct,
            order_number: order_number || option.order_number
        });

        return response.status(200).json({
            success: true,
            message: "Option updated successfully.",
            data: option
        });

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error updating option",
            error: error.message
        });
    }
}

exports.deleteOption = async (request, response) => {
    try {
        const { id } = request.params;

        const option = await OptionModel.findByPk(id);
        if (!option)
            return response.status(404).json({
                success: false,
                message: "Option not found!"
            });

        await option.destroy();

        return response.status(200).json({
            success: true,
            message: "Option deleted successfully."
        });

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error deleting option",
            error: error.message
        });
    }
}
