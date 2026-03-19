import { z } from "zod";

// 1️⃣ Request Signup OTP
export const requestSignupOtpSchema = z.object({
  body: z.object({
    fullname: z.string().min(3).max(50),
    email: z.string().email(),
    gender: z.enum(["Male", "Female", "Other"]),
    mobile: z.string().optional(),
  }),
});

// 2️⃣ Verify Signup OTP
export const verifySignupOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6), // 6 digit OTP
  }),
});

// 3️⃣ Complete Signup
export const completeSignupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[a-z]/, "Must contain lowercase")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[@$!%*?&]/, "Must contain special char"),
    address: z
      .object({
        label: z.string().optional(),
        fulladdress: z.string().optional(),
        city: z.string().optional(),
        area: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      })
      .optional(),
  }),
});

// 4️⃣ Login Step 1
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

// 5️⃣ Login OTP Verify
export const loginOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }),
});