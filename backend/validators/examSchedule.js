const yup = require("yup");

const examScheduleSchema = yup.object().shape({
    title: yup.string().max(100).default("آزمون ماهانه"),
    exam_date: yup.date().typeError("تاریخ آزمون معتبر نیست").required("تاریخ برگزاری آزمون الزامی است"),
});

module.exports = examScheduleSchema;
