const userSchema = require("./register");
const yup = require("yup");

// دقیقاً همون فیلدهای فرم ثبت‌نام عمومی دانش‌آموز، به‌علاوه‌ی انتخاب مشاور
// (که فقط ادمین انجامش می‌ده، توی ثبت‌نام عمومی معنی نداره)
const adminCreateStudentSchema = userSchema.shape({
  consultant_id: yup
    .number()
    .typeError("انتخاب مشاور الزامی است")
    .integer()
    .positive()
    .required("انتخاب مشاور الزامی است"),
});

module.exports = adminCreateStudentSchema;
