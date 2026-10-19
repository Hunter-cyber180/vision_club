const express = require("express");
const controller = require("../controllers/auth");
const validate = require("../middlewares/validate");
const { verifyLoginCredentials, authenticateAccessToken } = require("../middlewares/auth");
const registerSchema = require("../validators/register");
const loginSchema = require("../validators/login");

const router = express.Router();

router.route("/register")
    .post(validate(registerSchema), controller.register);

router.route("/login")
    .post(validate(loginSchema), verifyLoginCredentials("user"), controller.login);

router.route("/refresh")
    .post(controller.refresh);

router.route("/logout")
    .post(authenticateAccessToken("user"), controller.logout);

router.route("/me")
    .get(authenticateAccessToken("user"), controller.me)
    .put(authenticateAccessToken("user"), controller.updateMe);

module.exports = router;
