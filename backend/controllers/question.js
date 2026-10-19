const { Question: QuestionModel, Quiz: QuizModel, sequelize } = require("../models");

exports.addQuestion = async (request, response) => {
    try {
        const { quizId } = request.params;
        const { question_text, image_url, order_number } = request.body;

        const quiz = await QuizModel.findByPk(quizId);
        if (!quiz)
            return response.status(404).json({ success: false, message: "آزمون یافت نشد!" });

        const lastQuestion = await QuestionModel.findOne({
            where: { quiz_id: quizId },
            order: [['order_number', 'DESC']]
        });

        const question = await QuestionModel.create({
            quiz_id: quizId,
            question_text,
            image_url: image_url || null,
            order_number: order_number || (lastQuestion ? lastQuestion.order_number + 1 : 1)
        });

        return response.status(201).json({ success: true, data: question });

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error creating question",
            error: error.message
        });
    }
}

exports.addMultipleQuestions = async (request, response) => {
    const transaction = await sequelize.transaction();
    try {
        const { quizId } = request.params;
        const { questions } = request.body;

        if (!questions || !Array.isArray(questions)) {
            await transaction.rollback();
            return response.status(400).json({
                success: false,
                message: "لیست سوالات نامعتبر است!"
            });
        }

        const quiz = await QuizModel.findByPk(quizId);
        if (!quiz) {
            await transaction.rollback();
            return response.status(404).json({ success: false, message: "آزمون یافت نشد!" });
        }

        const createdQuestions = [];

        for (let i = 0; i < questions.length; i++) {
            const qData = questions[i];

            const question = await QuestionModel.create({
                quiz_id: quizId,
                question_text: qData.question_text,
                image_url: qData.image_url || null,
                order_number: qData.order_number || (i + 1)
            }, { transaction });

            createdQuestions.push(question);
        }

        await transaction.commit();

        return response.status(201).json({ success: true, data: createdQuestions });
    } catch (error) {
        await transaction.rollback();
        return response.status(500).json({
            success: false,
            message: "Error creating questions!",
            error: error.message
        });
    }
}

exports.updateQuestion = async (request, response) => {
    try {
        const { id } = request.params;
        const { question_text, image_url, order_number } = request.body;

        const question = await QuestionModel.findByPk(id);
        if (!question)
            return response.status(404).json({
                success: false,
                message: "Question not found!"
            });

        await question.update({
            question_text: question_text || question.question_text,
            image_url: image_url !== undefined ? image_url : question.image_url,
            order_number: order_number || question.order_number
        });

        return response.status(200).json({
            success: true,
            message: "Question updated successfully.",
            data: question
        });

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error updating question!",
            error: error.message
        });
    }
}

exports.deleteQuestion = async (request, response) => {
    try {
        const { id } = request.params;

        const question = await QuestionModel.findByPk(id);
        if (!question)
            return response.status(404).json({
                success: false,
                message: "Question not found!"
            });

        await question.destroy();

        return response.status(200).json({
            success: true,
            message: "Question deleted successfully."
        });

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error deleting question",
            error: error.message
        });
    }
}
