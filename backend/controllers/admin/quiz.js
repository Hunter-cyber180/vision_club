const { Quiz: QuizModel, Question: QuestionModel, Op } = require("../../models");

exports.getAllQuizzes = async (request, response) => {
    try {
        const { page = 1, limit = 6, status, major, grade } = request.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const whereClause = {};
        if (status) whereClause.status = status;
        if (major) whereClause.major = major;
        if (grade) whereClause.grade = grade;

        const { rows: quizzes, count } = await QuizModel.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            distinct: true,
            include: [{
                model: QuestionModel,
                as: 'questions',
                attributes: ['id']
            }],
            order: [['scheduled_at', 'DESC']]
        });

        return response.status(200).json({
            success: true,
            data: quizzes,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error getting quizzes!",
            error: error.message
        });
    };
};

// آزمون ماهانه توسط ادمین ساخته می‌شود؛ سوالات جداگانه با
// POST /admin/quizzes/:quizId/questions اضافه می‌شوند (controllers/question.js)
exports.createQuiz = async (request, response) => {
    try {
        const { title, description, scheduled_at, answersheet_link, time_minutes, major, grade, question_count } = request.body;

        if (!title || !scheduled_at || !time_minutes)
            return response.status(400).json({
                success: false,
                message: "عنوان، تاریخ برگزاری و مدت زمان آزمون الزامی است"
            });

        const quiz = await QuizModel.create({
            title,
            description,
            scheduled_at,
            answersheet_link,
            time_minutes,
            major,
            grade,
            question_count,
            status: "not-held"
        });

        return response.status(201).json({
            success: true,
            message: "آزمون با موفقیت ساخته شد.",
            data: quiz
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error creating quiz!",
            error: error.message
        });
    }
};

exports.updateQuizStatus = async (request, response) => {
    try {
        const { quizId } = request.params;
        const { status } = request.body;

        if (!["not-held", "held", "ongoing"].includes(status))
            return response.status(400).json({
                success: false,
                message: "وضعیت نامعتبر است"
            });

        const quiz = await QuizModel.findByPk(quizId);
        if (!quiz)
            return response.status(404).json({
                success: false,
                message: "Quiz not found!"
            });

        quiz.status = status;
        await quiz.save();

        return response.status(200).json({
            success: true,
            message: "وضعیت آزمون به‌روزرسانی شد.",
            data: quiz
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error updating quiz status!",
            error: error.message
        });
    }
};

exports.deleteQuizById = async (request, response) => {
    try {
        const { quizId } = request.params;
        const quiz = await QuizModel.findByPk(quizId);
        if (!quiz)
            return response.status(404).json({
                success: false,
                message: "Quiz not found!"
            });

        await quiz.destroy();

        return response.status(200).json({
            success: true,
            message: "Quiz deleted."
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error deleting quiz!",
            error: error.message
        });
    }
};
