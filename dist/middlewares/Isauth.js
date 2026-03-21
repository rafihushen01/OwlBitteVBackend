import jwt from "jsonwebtoken";
import user from "../models/User.js";
import TryCatch from "../middlewares/TryCatch.js";
import { hashToken } from "../utils/token.js";
export const isAuth = TryCatch(async (req, res, next) => {
    const accesstoken = req.cookies?.accesstoken ||
        req.headers.authorization?.split(" ")[1];
    if (!accesstoken) {
        return res.status(401).json({ message: "Unauthorized - No token" });
    }
    let decoded;
    try {
        decoded = jwt.verify(accesstoken, process.env.JWT_ACCESS_SECRET);
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
    const existingUser = await user.findById(decoded.userId);
    if (!existingUser) {
        return res.status(401).json({ message: "User not found" });
    }
    if (existingUser.isblocked) {
        return res.status(403).json({ message: "Account blocked" });
    }
    if (existingUser.isLocked()) {
        return res.status(403).json({ message: "Account temporarily locked" });
    }
    req.user = existingUser;
    next();
});
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
};
export const verifyRefreshToken = TryCatch(async (req, res, next) => {
    const refreshtoken = req.cookies?.refreshtoken;
    if (!refreshtoken) {
        return res.status(401).json({ message: "No refresh token" });
    }
    let decoded;
    try {
        decoded = jwt.verify(refreshtoken, process.env.JWT_REFRESH_SECRET);
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid refresh token" });
    }
    const existingUser = await user.findById(decoded.userId);
    if (!existingUser || !existingUser.refreshtoken) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const hashedIncoming = hashToken(refreshtoken);
    if (hashedIncoming !== existingUser.refreshtoken) {
        return res.status(401).json({ message: "Token mismatch" });
    }
    req.user = existingUser;
    next();
});
export const rotateTokens = TryCatch(async (req, res) => {
    const existingUser = req.user;
    if (!existingUser) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { generateTokens } = await import("../utils/token.js");
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
        message: "Tokens refreshed",
    });
});
//# sourceMappingURL=Isauth.js.map