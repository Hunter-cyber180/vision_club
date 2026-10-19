const express = require("express");
const controller = require("../controllers/consultantAuth");
const validate = require("../middlewares/validate");
const { verifyLoginCredentials, authenticateAccessToken } = require("../middlewares/auth");
const loginSchema = require("../validators/login");
const consultantRegisterSchema = require("../validators/consultantRegister");

const router = express.Router();

router.route("/register")
    .post(validate(consultantRegisterSchema), controller.register);

router.route("/login")
    .post(validate(loginSchema), verifyLoginCredentials("consultant"), controller.login);

router.route("/refresh")
    .post(controller.refresh);

router.route("/logout")
    .post(authenticateAccessToken("consultant"), controller.logout);

router.route("/me")
    .get(authenticateAccessToken("consultant"), controller.me)
    .put(authenticateAccessToken("consultant"), controller.updateMe);

module.exports = router;
