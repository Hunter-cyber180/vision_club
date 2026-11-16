const yup = require("yup");

const dailyReportSchema = yup.object().shape({
    report_date: yup.date().typeError("تاریخ گزارش معتبر نیست").required("تاریخ گزارش الزامی است"),
    sleep_time: yup.string().required("تایم خواب الزامی است"),
    wake_time: yup.string().required("تایم بیداری الزامی است"),
    screen_time: yup.string().nullable(),
    weak_points: yup.string().nullable().max(1000),
    need_help: yup.string().nullable().max(1000),
    lessons: yup.array().of(
        yup.object().shape({
            subject: yup.string().required("نام درس الزامی است"),
            test_count: yup.number().integer().min(0).default(0),
            essay_count: yup.number().integer().min(0).default(0),
            study_minutes: yup.number().integer().min(0).default(0),
            activity_type: yup.string().nullable(),
        })
    ).optional(),
});

module.exports = dailyReportSchema;
