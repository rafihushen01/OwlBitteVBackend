import express from "express"
import { completesignup, loginStep1, loginVerifyOtp, requestsignupotp, verifysignupotp } from "../controllers/Authcontroller.js"
import { isAuth } from "../middlewares/Isauth.js"
const router=express.Router()
router.post("/requestsignupotp",requestsignupotp)
router.post("/verifysignupotp",verifysignupotp)
router.post("/completesignup",completesignup)
router.post("/requestloginotp",loginStep1)
router.post("/completelogin",loginVerifyOtp)

export default router