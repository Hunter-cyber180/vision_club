const userSchema = require("./register");
const yup = require("yup");

const adminCreateStudentSchema = userSchema.shape({
  consultant_id: yup
    .number()
    .typeError("انتخاب مشاور الزامی است")
    .integer()
    .positive()
    .required("انتخاب مشاور الزامی است"),
});

module.exports = adminCreateStudentSchema;
