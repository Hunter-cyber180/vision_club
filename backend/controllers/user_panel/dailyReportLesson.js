const { DailyReport, DailyReportLesson } = require("../../models");

exports.getAllByReportId = async (request, response) => {
    try {
        const { report_id } = request.params;
        const daily_report = await DailyReport.findByPk(report_id);
        if(!daily_report)
            return response.status(404).json({
                success: false,
                message: "Daily report not found!"
            });

        const reportLessons = await DailyReportLesson.findAll({
            where: { report_id },
            order: [['id', 'ASC']],
        });

        return response.status(200).json({
            success: true,
            data: reportLessons,
            count: reportLessons.length
        });

    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error get report lessons",
            error: error.message
        });
    };
};

exports.createLesson = async (request, response) => {
    try {
        const { subject, test_count, essay_count, study_minutes, activity_type, report_id } = request.body;
        const daily_report = await DailyReport.findByPk(report_id);
        if(!daily_report)
            return response.status(404).json({
                success: false,
                message: "Daily report not found!"
            });
        
        const reportLesson = await DailyReportLesson.create({
            subject,
            test_count: test_count || 0,
            essay_count: essay_count || 0,
            study_minutes: study_minutes || 0,
            activity_type,
            report_id
        });

        return response.status(201).json({
            success: true,
            message: "Report lesson created successfully",
            data: reportLesson
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error creating lesson",
            error: error.message
        });
    };
};

exports.deleteLesson = async (request, response) => {
    try {
        const { lesson_id } = request.params;
        const reportLesson = await DailyReportLesson.findByPk(lesson_id);
        if(!reportLesson)
            return response.status(404).json({
                success: false,
                message: "Lesson not found!"
            });
        
        await reportLesson.destroy();

        return response.status(200).json({
            success: true,
            message: "Lesson deleted successfully"
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error delete lesson",
            error: error.message
        });
    };
};
