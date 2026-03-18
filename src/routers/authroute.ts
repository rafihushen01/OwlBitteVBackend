import express from "express"
import { completesignup, requestsignupotp, verifysignupotp } from "../controllers/Authcontroller.js"
const router=express.Router()
router.post("/requestsignupotp",requestsignupotp)
router.post("/verifysignupotp",verifysignupotp)
router.post("/compeletesignup",completesignup)

export default router