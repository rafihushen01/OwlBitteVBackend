import bcrypt from "bcryptjs";
import validator from "validator";
import crypto from "crypto";
import sanitize from "mongo-sanitize";
import user from "../models/User.js";
import TryCatch from "../middlewares/TryCatch.js";
import { setSignupOtp, getSignupOtp, deleteSignupOtp, } from "../utils/otpStore.js";
import { sendSigninOtp, sendSignupOtp } from "../utils/mail.js";
import { generateTokens, hashToken } from "../utils/token.js";
const generateotp = () => crypto.randomInt(100000, 999999).toString();
export const requestsignupotp = TryCatch(async (req, res) => {
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
});
export const verifysignupotp = TryCatch(async (req, res) => {
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
});
export const completesignup = TryCatch(async (req, res) => {
    const { email, password, address } = sanitize(req.body);
    const data = getSignupOtp(email);
    if (!data) {
        return res.status(400).json({ message: "Session expired" });
    }
    const hashedpassword = await bcrypt.hash(password, 12);
    let avatar = "/thirdgenderavatar.png";
    if (data.gender === "Male")
        avatar = "/maleavatar.png";
    else if (data.gender === "Female")
        avatar = "/femaleavatar.png";
    const userPayload = {
        fullname: data.fullname,
        email: data.email,
        gender: data.gender,
        password: hashedpassword,
        avatar,
        isverified: true,
    };
    if (data.mobile) {
        userPayload.mobile = data.mobile;
    }
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
    const newuser = await user.create(userPayload);
    deleteSignupOtp(email);
    const { accesstoken, refreshtoken } = generateTokens(newuser._id.toString());
    newuser.refreshtoken = hashToken(refreshtoken);
    await newuser.save();
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
});
export const loginStep1 = TryCatch(async (req, res) => {
    const { email, password } = sanitize(req.body);
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    if (existingUser.isblocked) {
        return res.status(403).json({ message: "Account blocked" });
    }
    if (existingUser.isLocked()) {
        return res.status(403).json({ message: "Too many attempts. Try later." });
    }
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
        existingUser.loginattempts = (existingUser.loginattempts || 0) + 1;
        if (existingUser.loginattempts >= 13) {
            existingUser.lockuntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        await existingUser.save();
        return res.status(400).json({ message: "Invalid credentials" });
    }
    existingUser.loginattempts = 0;
    existingUser.lockuntil = undefined;
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
export const loginVerifyOtp = TryCatch(async (req, res) => {
    const { email, otp } = sanitize(req.body);
    const existingUser = await user.findOne({ email });
    if (!existingUser || !existingUser.signinotp) {
        return res.status(400).json({ message: "Session expired" });
    }
    if (existingUser.signinotpexpires < new Date()) {
        return res.status(400).json({ message: "OTP expired" });
    }
    existingUser.signinattempts = (existingUser.signinattempts || 0) + 1;
    if (existingUser.signinattempts > 5) {
        await existingUser.save();
        return res.status(429).json({ message: "Too many OTP attempts" });
    }
    const isOtpValid = await bcrypt.compare(otp, existingUser.signinotp);
    if (!isOtpValid) {
        await existingUser.save();
        return res.status(400).json({ message: "Invalid OTP" });
    }
    existingUser.signinotp = undefined;
    existingUser.signinotpexpires = undefined;
    existingUser.signinattempts = 0;
    const { accesstoken, refreshtoken } = generateTokens(existingUser._id.toString());
    existingUser.refreshtoken = hashToken(refreshtoken);
    await existingUser.save();
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
//# sourceMappingURL=Authcontroller.js.map