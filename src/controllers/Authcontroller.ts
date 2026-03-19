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
import { sendSigninOtp, sendSignupOtp } from "../utils/mail.js";
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
export const loginStep1 = TryCatch(async (req: Request, res: Response) => {
  const { email, password } = sanitize(req.body);

  const existingUser = await user.findOne({ email });

  if (!existingUser) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // 🔒 BLOCK CHECK
  if (existingUser.isblocked) {
    return res.status(403).json({ message: "Account blocked" });
  }

  // 🔒 LOCK CHECK
  if (existingUser.isLocked()) {
    return res.status(403).json({ message: "Too many attempts. Try later." });
  }

  // 🔑 PASSWORD CHECK
  const isMatch = await bcrypt.compare(password, existingUser.password);

  if (!isMatch) {
    existingUser.loginattempts = (existingUser.loginattempts || 0) + 1;

    // 🚫 LOCK AFTER 13 ATTEMPTS
    if (existingUser.loginattempts >= 13) {
      existingUser.lockuntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    }

    await existingUser.save();

    return res.status(400).json({ message: "Invalid credentials" });
  }

  // ✅ RESET ATTEMPTS
  existingUser.loginattempts = 0;
  existingUser.lockuntil = undefined;

  // 🔥 GENERATE OTP
  const otp = generateotp();

  existingUser.signinotp = await bcrypt.hash(otp, 10);
  existingUser.signinotpexpires = new Date(Date.now() + 5 * 60 * 1000);
  existingUser.signinattempts = 0;

  await existingUser.save();

  await sendSigninOtp(email, otp);

  return res.json({
    success: true,
    message: "OTP sent",
  });
});
export const loginVerifyOtp = TryCatch(async (req: Request, res: Response) => {
  const { email, otp } = sanitize(req.body);

  const existingUser = await user.findOne({ email });

  if (!existingUser || !existingUser.signinotp) {
    return res.status(400).json({ message: "Session expired" });
  }

  // ⏰ EXPIRE CHECK
  if (existingUser.signinotpexpires! < new Date()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  // 🚫 OTP ATTEMPTS LIMIT
  existingUser.signinattempts = (existingUser.signinattempts || 0) + 1;

  if (existingUser.signinattempts > 5) {
    await existingUser.save();
    return res.status(429).json({ message: "Too many OTP attempts" });
  }

  // 🔑 COMPARE HASHED OTP
  const isOtpValid = await bcrypt.compare(otp, existingUser.signinotp);

  if (!isOtpValid) {
    await existingUser.save();
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // ✅ CLEAR OTP (VERY IMPORTANT)
  existingUser.signinotp = undefined;
  existingUser.signinotpexpires = undefined;
  existingUser.signinattempts = 0;

  // 🔥 TOKENS
  const { accesstoken, refreshtoken } = generateTokens(
    existingUser._id.toString()
  );

  existingUser.refreshtoken = hashToken(refreshtoken);

  await existingUser.save();

  // 🍪 COOKIES
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
    message: "Login successful",
  });
});