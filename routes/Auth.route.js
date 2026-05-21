const express = require("express");
const { register, verifyRegisterOtp, Login , forgetPassword, resetPassword, Logout, verifyResetOtp } = require("../controllers/auth.controller");

const AuthRouter = express.Router();
require('../controllers/auth.controller')

AuthRouter.post('/register', register);
AuthRouter.post('/verify', verifyRegisterOtp);
AuthRouter.post('/login', Login);
AuthRouter.post('/forgetPassword' , forgetPassword);
AuthRouter.post('/verifyResetOTP',verifyResetOtp);
AuthRouter.post('/resetPassword', resetPassword);
AuthRouter.post('/logout', Logout);

module.exports = AuthRouter