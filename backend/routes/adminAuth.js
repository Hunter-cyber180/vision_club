const express = require("express");
const controller = require("../controllers/adminAuth");
const validate = require("../middlewares/validate");
const { verifyLoginCredentials, authenticateAccessToken } = require("../middlewares/auth");
const loginSchema = require("../validators/login");

const router = express.Router();

router.route("/login")
    .post(validate(loginSchema), verifyLoginCredentials("admin"), controller.login);

router.route("/logout")
    .post(authenticateAccessToken("admin"), controller.logout);

router.route("/me")
    .get(authenticateAccessToken("admin"), controller.me)
    .put(authenticateAccessToken("admin"), controller.updateMe);

router.route("/socket-token")
    .get(authenticateAccessToken("admin"), controller.getSocketToken);

module.exports = router;
