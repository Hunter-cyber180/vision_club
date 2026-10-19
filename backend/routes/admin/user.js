const express = require("express");
const controller = require("../../controllers/admin/user");
const { authenticateAccessToken } = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const adminCreateStudentSchema = require("../../validators/adminCreateStudent");

const router = express.Router();

router.use(authenticateAccessToken("admin"));

router.get("/users", controller.getAllUsers);
router.get("/students", controller.getAllStudents);
router.get("/people", controller.getAllPeople);
router.post("/students", validate(adminCreateStudentSchema), controller.createStudent);
router.patch("/:userId/role", controller.setUserRole);
router.put("/users/:userId", controller.updateUser);
router.delete("/users/:userId", controller.deleteUser);

module.exports = router;
