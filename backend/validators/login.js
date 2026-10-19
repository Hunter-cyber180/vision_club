const yup = require("yup");

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email("Email format is not valid!")
    .required("Email is required!")
    .lowercase()
    .trim(),
  password: yup.string().required("Password is required!"),
});

module.exports = loginSchema;
