const { UserQuiz: UserQuizModel, Quiz: QuizModel, User: UserModel, Op } = require("../../models");

exports.getUserQuizzes = async (request, response) => {
    try {
        const { userId } = request.params;
        const userQuizzes = await UserQuizModel.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: QuizModel,
                    as: "quiz"
                }
            ]
        });

        return response.status(200).json({
            success: true,
            data: userQuizzes
        });

    } catch (error) {
        return response.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.getQuizUsers = async (request, response) => {
    try {
        const { quizId } = request.params;
        const userQuizzes = await UserQuizModel.findAll({
            where: { quiz_id: quizId },
            include: [
                {
                    model: UserModel,
                    as: "user"
                }
            ]
        });

        return response.status(200).json({
            success: true,
            data: userQuizzes
        });

    } catch (error) {
        return response.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ==================== GET ONE ====================
exports.getUserQuiz = async (request, response) => {
    try {
        const { id } = request.params;
        const userQuiz = await UserQuizModel.findByPk(id, {
            include: [
                {
                    model: QuizModel,
                    as: "quiz",
                },
                {
                    model: UserModel,
                    as: "user"
                }
            ]
        });

        if (!userQuiz)
            return response.status(404).json({
                success: false,
                message: "user quiz not found!"
            });

        return response.status(200).json({
            success: true,
            data: userQuiz
        });

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error get user quiz!",
            error: error.message
        });
    }
};

// ==================== CREATE ====================
exports.createUserQuiz = async (request, response) => {
    try {
        const {
            user_id,
            quiz_id,
            score_percentage
        } = request.body;

        const userQuiz = await UserQuizModel.create({
            user_id,
            quiz_id,
            score_percentage
        });

        return response.status(201).json({
            success: true,
            message: "user quiz created successfully.",
            data: userQuiz
        });

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error create user quiz!",
            error: error.message
        });
    }
};

// ==================== UPDATE ====================
exports.updateUserQuiz = async (request, response) => {
    try {
        const { id } = request.params;
        const {
            user_id,
            quiz_id,
            score_percentage
        } = request.body;

        const userQuiz = await UserQuizModel.findByPk(id);
        if (!userQuiz)
            return response.status(404).json({
                success: false,
                message: "User quiz not found!"
            });

        await userQuiz.update({
            user_id,
            quiz_id,
            score_percentage
        });

        await userQuiz.reload({
            include: [
                {
                    model: UserModel,
                    as: "user",
                },
                {
                    model: QuizModel,
                    as: "quiz"
                }
            ]
        });

        return response.status(200).json({
            success: true,
            message: "User quiz updated successfully",
            data: userQuiz
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error update user quiz!",
            error: error.message
        });
    }
};

// ==================== DELETE ====================
exports.deleteUserQuiz = async (request, response) => {
    try {
        const { id } = request.params;
        const userQuiz = await UserQuizModel.findByPk(id);
        if (!userQuiz)
            return response.status(404).json({
                success: false,
                message: "user quiz not found!"
            });

        await userQuiz.destroy();

        return response.status(200).json({
            success: true,
            message: "User quiz deleted successfully"
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error delete user quiz",
            error: error.message
        });
    }
};
