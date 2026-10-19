const yup = require("yup");
const phoneRegex = /^[0-9]{10,15}$/;

const consultantRegisterSchema = yup.object().shape({
    name: yup.string().required("نام الزامی است").max(100).trim(),
    lastname: yup.string().required("نام خانوادگی الزامی است").max(100).trim(),
    email: yup.string().email("فرمت ایمیل نامعتبر است").required("ایمیل الزامی است").lowercase().trim(),
    consultant_password: yup.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد").required("رمز عبور الزامی است"),
    confirmPassword: yup.string().oneOf([yup.ref("consultant_password")], "رمز عبور و تأیید آن مطابقت ندارند").required("تأیید رمز عبور الزامی است"),
    phone_number: yup.string().matches(phoneRegex, "شماره تلفن نامعتبر است").required("شماره تلفن الزامی است"),
    telegram_id: yup.string().nullable().max(100),
    counseling_fields: yup.array().of(yup.string().oneOf(["انسانی", "ریاضی", "تجربی"])).min(1, "حداقل یک رشته را انتخاب کنید").required(),
    consultation_type: yup.string().oneOf(["individual", "group", "both"]).default("both"),
    experience_years: yup.number().integer().min(0).default(0),
    education: yup.string().nullable(),
    skills: yup.string().nullable(),
    bio: yup.string().nullable(),
});

module.exports = consultantRegisterSchema;
