const { AnalysisExam, AnalysisExamLesson } = require("../../models");

exports.getAllByExamId = async (request, response) => {
    try {
        const { exam_id } = request.params;
        const analysis_exam = await AnalysisExam.findByPk(exam_id);
        if (!analysis_exam)
            return response.status(404).json({
                success: false,
                message: "Analysis exam not found!"
            });

        const analysisExamLessons = await AnalysisExamLesson.findAll({
            where: { analysis_id: exam_id },
            order: [['id', 'ASC']],
        });

        return response.status(200).json({
            success: true,
            data: analysisExamLessons,
            count: analysisExamLessons.length
        });

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error get analysis exam lessons",
            error: error.message
        });
    };
};

exports.createLesson = async (request, response) => {
    try {
        const { subject, test_count, correct_count, wrong_minutes, analysis_id } = request.body;
        const analysis_exam = await AnalysisExam.findByPk(analysis_id);
        if (!analysis_exam)
            return response.status(404).json({
                success: false,
                message: "Analysis exam not found!"
            });

        const lesson = await AnalysisExamLesson.create({
            subject,
            test_count: test_count || 0,
            correct_count: correct_count || 0,
            wrong_minutes: wrong_minutes || 0,
            analysis_id
        });

        return response.status(201).json({
            success: true,
            message: "Analysis exam lesson created successfully",
            data: lesson
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error creating lesson",
            error: error.message
        });
    };
};

exports.updateLesson = async (request, response) => {
    try {
        const { lesson_id } = request.params;
        const { subject, test_count, correct_count, wrong_minutes } = request.body;

        const lesson = await AnalysisExamLesson.findByPk(lesson_id);
        if (!lesson)
            return response.status(404).json({
                success: false,
                message: "Lesson not found!"
            });

        await lesson.update({
            subject: subject ?? lesson.subject,
            test_count: test_count ?? lesson.test_count,
            correct_count: correct_count ?? lesson.correct_count,
            wrong_minutes: wrong_minutes ?? lesson.wrong_minutes,
        });

        return response.status(200).json({
            success: true,
            message: "Lesson updated successfully",
            data: lesson
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error updating lesson",
            error: error.message
        });
    };
};

exports.deleteLesson = async (request, response) => {
    try {
        const { lesson_id } = request.params;
        const lesson = await AnalysisExamLesson.findByPk(lesson_id);
        if (!lesson)
            return response.status(404).json({
                success: false,
                message: "Lesson not found!"
            });

        await lesson.destroy();

        return response.status(200).json({
            success: true,
            message: "Lesson deleted successfully"
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error delete lesson",
            error: error.message
        });
    };
};
