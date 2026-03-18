import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import validator from "validator";
import crypto from "crypto";
import sanitize from "mongo-sanitize";

import user from "../models/User.js";
import TryCatch from "../middlewares/TryCatch.js";


import {
  setSignupOtp,
  getSignupOtp,
  deleteSignupOtp,
} from "../utils/otpStore.js";
import { sendSignupOtp } from "../utils/mail.js";
import { generateTokens, hashToken } from "../utils/token.js";

const generateotp = (): string =>
  crypto.randomInt(100000, 999999).toString();


// ================= STEP 1: REQUEST OTP =================
export const requestsignupotp = TryCatch(
  async (req: Request, res: Response) => {
    const { fullname, email, gender, mobile } = sanitize(req.body);

    if (!fullname || !email || !gender) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const existing = await user.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = generateotp();

    setSignupOtp(email, {
      fullname,
      email,
      gender,
      mobile,
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    });

    await sendSignupOtp(email, otp);

    return res.json({ message: "OTP sent successfully" });
  }
);


// ================= STEP 2: VERIFY OTP =================
export const verifysignupotp = TryCatch(
  async (req: Request, res: Response) => {
    const { email, otp } = sanitize(req.body);

    const data = getSignupOtp(email);

    if (!data) {
      return res.status(400).json({ message: "No OTP found" });
    }

    if (data.expires < Date.now()) {
      deleteSignupOtp(email);
      return res.status(400).json({ message: "OTP expired" });
    }

    if (data.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    return res.json({
      success: true,
      message: "OTP verified",
    });
  }
);


// ================= STEP 3: COMPLETE SIGNUP =================
export const completesignup = TryCatch(
  async (req: Request, res: Response) => {
    const { email, password, address } = sanitize(req.body);

    const data = getSignupOtp(email);

    if (!data) {
      return res.status(400).json({ message: "Session expired" });
    }

    // ================= PASSWORD =================
    const hashedpassword = await bcrypt.hash(password, 12);

    // ================= AVATAR BY GENDER =================
    let avatar = "/thirdgenderavatar.png";

    if (data.gender === "Male") avatar = "/maleavatar.png";
    else if (data.gender === "Female") avatar = "/femaleavatar.png";

    // ================= CLEAN OBJECT (REMOVE UNDEFINED) =================
    const userPayload: any = {
      fullname: data.fullname,
      email: data.email,
      gender: data.gender,
      password: hashedpassword,
      avatar,
      isverified: true,
    };

    // ✅ only add mobile if exists
    if (data.mobile) {
      userPayload.mobile = data.mobile;
    }

    // ================= ADDRESS HANDLING =================
    if (address) {
      userPayload.addresses = [
        {
          label: address.label || "Home",
          fulladdress: address.fulladdress || "",
          city: address.city || "",
          area: address.area || "",
          lat: address.lat || 0,
          lng: address.lng || 0,
          isdefault: true,
        },
      ];
    }

    // ================= CREATE USER =================
    const newuser = await user.create(userPayload);

    deleteSignupOtp(email);

    // ================= TOKENS =================
    const { accesstoken, refreshtoken } = generateTokens(
      newuser._id.toString()
    );

    newuser.refreshtoken = hashToken(refreshtoken);
    await newuser.save();

    // ================= COOKIES =================
    res.cookie("accesstoken", accesstoken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.cookie("refreshtoken", refreshtoken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return res.json({
      success: true,
      message: "Account created successfully",
    });
  }
);