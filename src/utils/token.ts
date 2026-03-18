import jwt from "jsonwebtoken";
import crypto from "crypto";

const accesssecret = process.env.JWT_ACCESS_SECRET!;
const refreshsecret = process.env.JWT_REFRESH_SECRET!;

export const generateTokens = (userId: string) => {

    const accesstoken = jwt.sign(
        { userId },
        accesssecret,
        { expiresIn: "15m" }
    );

    const refreshtoken = jwt.sign(
        { userId },
        refreshsecret,
        { expiresIn: "7d" }
    );

    return { accesstoken, refreshtoken };
};

// HASH REFRESH TOKEN (VERY IMPORTANT)
export const hashToken = (token: string) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};