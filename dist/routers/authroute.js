import express from "express";
import { validate } from "../middlewares/zodvalidator.js";
import { completeSignupSchema, loginOtpSchema, loginSchema, requestSignupOtpSchema, verifySignupOtpSchema } from "../validator/authschema.js";
import { completesignup, loginStep1, loginVerifyOtp, requestsignupotp, verifysignupotp } from "../controllers/Authcontroller.js";
const router = express.Router();
router.post("/signup/otp", validate(requestSignupOtpSchema), (req, res) => {
    const { body } = req.validated;
    requestsignupotp(req, res, body);
});
router.post("/signup/otp/verify", validate(verifySignupOtpSchema), (req, res) => {
    const { body } = req.validated;
    verifysignupotp(req, res, body);
});
router.post("/signup/complete", validate(completeSignupSchema), (req, res) => {
    const { body } = req.validated;
    completesignup(req, res, body);
});
router.post("/login", validate(loginSchema), (req, res) => {
    const { body } = req.validated;
    loginStep1(req, res, body);
});
router.post("/login/otp", validate(loginOtpSchema), (req, res) => {
    const { body } = req.validated;
    loginVerifyOtp(req, res, body);
});
export default router;
//# sourceMappingURL=authroute.js.map