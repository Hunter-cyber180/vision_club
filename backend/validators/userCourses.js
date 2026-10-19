const yup = require("yup");

const userCoursesSchema = yup.object().shape({
    user_id: yup.
        number().
        integer().
        positive().
        required("User ID is required"),
    course_id: yup
        .number()
        .integer()
        .positive()
        .required("Course ID is required"),
    last_lesson_id: yup
        .number()
        .integer()
        .positive()
        .required("Last lesson ID is required"),
    status: yup
        .string()
        .oneOf(["in-progress", "completed"], "Status must be either 'in-progress' or 'completed'").default("in-progress"),
});

module.exports = userCoursesSchema;
