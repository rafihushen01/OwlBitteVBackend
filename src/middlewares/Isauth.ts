import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sanitize from "mongo-sanitize";

import user from "../models/User.js";
import TryCatch from "../middlewares/TryCatch.js";
import { hashToken } from "../utils/token.js";

/*
=====================================================
 EXTENDED REQUEST TYPE (VERY IMPORTANT)
=====================================================
*/

export interface AuthRequest extends Request {
  user?: any;
}

/*
=====================================================
 CORE AUTH MIDDLEWARE
=====================================================
*/

export const isAuth = TryCatch(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // ================= TOKEN GET =================
    const accesstoken =
      req.cookies?.accesstoken ||
      req.headers.authorization?.split(" ")[1];

    if (!accesstoken) {
      return res.status(401).json({ message: "Unauthorized - No token" });
    }

    let decoded: any;

    try {
      decoded = jwt.verify(
        accesstoken,
        process.env.JWT_ACCESS_SECRET!
      );
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // ================= USER FETCH =================
    const existingUser = await user.findById(decoded.userId);

    if (!existingUser) {
      return res.status(401).json({ message: "User not found" });
    }

    // ================= BLOCK CHECK =================
    if (existingUser.isblocked) {
      return res.status(403).json({ message: "Account blocked" });
    }

    // ================= LOCK CHECK =================
    if (existingUser.isLocked()) {
      return res.status(403).json({ message: "Account temporarily locked" });
    }

    // ================= ATTACH USER =================
    req.user = existingUser;

    next();
  }
);

/*
=====================================================
 ROLE BASED AUTH (SUPER ADMIN / ADMIN / SELLER)
=====================================================
*/

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

/*
=====================================================
 REFRESH TOKEN AUTH (VERY IMPORTANT)
=====================================================
*/

export const verifyRefreshToken = TryCatch(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const refreshtoken = req.cookies?.refreshtoken;

    if (!refreshtoken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    let decoded: any;

    try {
      decoded = jwt.verify(
        refreshtoken,
        process.env.JWT_REFRESH_SECRET!
      );
    } catch (error) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const existingUser = await user.findById(decoded.userId);

    if (!existingUser || !existingUser.refreshtoken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔥 HASH MATCH CHECK (CRITICAL)
    const hashedIncoming = hashToken(refreshtoken);

    if (hashedIncoming !== existingUser.refreshtoken) {
      return res.status(401).json({ message: "Token mismatch" });
    }

    req.user = existingUser;

    next();
  }
);

/*
=====================================================
 ROTATE TOKENS (ANTI TOKEN REPLAY)
=====================================================
*/

export const rotateTokens = TryCatch(
  async (req: AuthRequest, res: Response) => {
    const existingUser = req.user;

    if (!existingUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { generateTokens } = await import("../utils/token.js");

    const { accesstoken, refreshtoken } = generateTokens(
      existingUser._id.toString()
    );

    // 🔥 SAVE HASHED REFRESH TOKEN
    existingUser.refreshtoken = hashToken(refreshtoken);
    await existingUser.save();

    // 🍪 SET NEW COOKIES
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
  }
);