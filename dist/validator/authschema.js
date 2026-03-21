import { z } from "zod";
export const requestSignupOtpSchema = z.object({
    body: z.object({
        fullname: z.string().min(3).max(50),
        email: z.string().email(),
        gender: z.enum(["Male", "Female", "Other"]),
        mobile: z.string().optional(),
    }),
});
export const verifySignupOtpSchema = z.object({
    body: z.object({
        email: z.string().email(),
        otp: z.string().length(6),
    }),
});
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
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
    }),
});
export const loginOtpSchema = z.object({
    body: z.object({
        email: z.string().email(),
        otp: z.string().length(6),
    }),
});
//# sourceMappingURL=authschema.js.map