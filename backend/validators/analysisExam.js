const yup = require("yup");

const analysisExamSchema = yup.object().shape({
    name: yup.string().required("نام آزمون الزامی است").max(50),
    organizer: yup.string().required("برگزارکننده آزمون الزامی است").max(50),
    test_date: yup.date().typeError("تاریخ آزمون معتبر نیست").required("تاریخ آزمون الزامی است"),
    rank: yup.number().integer().min(0).nullable(),
    standard_score: yup.number().integer().min(0).nullable(),
    weak_points: yup.string().nullable().max(200),
    notes: yup.string().nullable(),
    exam_schedule_id: yup.number().integer().positive().nullable(),
    lessons: yup.array().of(
        yup.object().shape({
            subject: yup.string().required("نام درس الزامی است"),
            test_count: yup.number().integer().min(0).default(0),
            correct_count: yup.number().integer().min(0).default(0),
            wrong_minutes: yup.number().integer().min(0).default(0),
        })
    ).optional(),
});

module.exports = analysisExamSchema;
