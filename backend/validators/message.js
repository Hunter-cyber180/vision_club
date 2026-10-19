const yup = require("yup");

const messageSchema = yup.object().shape({
    type: yup.string().oneOf(["text", "image"]).default("text"),
    text: yup.string().when("type", {
        is: "text",
        then: (schema) => schema.required("متن پیام الزامی است").max(5000),
        otherwise: (schema) => schema.nullable(),
    }),
    image_url: yup.string().when("type", {
        is: "image",
        then: (schema) => schema.required("آدرس تصویر الزامی است"),
        otherwise: (schema) => schema.nullable(),
    }),
});

module.exports = messageSchema;
