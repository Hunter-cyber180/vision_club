const express = require("express");
const validate = require("../../middlewares/validate");
const controller = require("../../controllers/user_panel/userWorkshops");
const userWorkshopsSchema = require("../../validators/userWorkshops");
const { authenticateAccessToken } = require("../../middlewares/auth");

const router = express.Router();

router.get("/user/:user_id", authenticateAccessToken("user", "consultant", "admin"), controller.getAllByUser);
router.post("/purchase", authenticateAccessToken("user"), controller.purchase);
router.post("/", authenticateAccessToken("user", "admin"), validate(userWorkshopsSchema), controller.create);

router.route("/:id")
    .get(authenticateAccessToken("user", "consultant", "admin"), controller.getOne)
    .put(authenticateAccessToken("admin"), validate(userWorkshopsSchema), controller.update)
    .delete(authenticateAccessToken("admin"), controller.delete);

router.patch("/:id/status", authenticateAccessToken("user", "admin"), controller.updateStatus);

module.exports = router;
