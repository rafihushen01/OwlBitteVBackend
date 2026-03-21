import { z, ZodError } from "zod";
import mongoSanitize from "mongo-sanitize";
const defaultSchema = z.object({
    body: z.record(z.string(), z.any()).optional(),
    query: z.record(z.string(), z.any()).optional(),
    params: z.record(z.string(), z.any()).optional(),
});
const sanitizeObject = (obj) => {
    if (typeof obj !== "object" || obj === null)
        return obj;
    for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
            obj[key] = sanitizeObject(obj[key]);
        }
        else {
            obj[key] = mongoSanitize(obj[key]);
        }
    }
    return obj;
};
export const globalZodMiddleware = (schemas) => {
    return (req, res, next) => {
        try {
            const schema = (schemas && schemas[req.path]) || defaultSchema;
            const result = schema.parse({
                body: sanitizeObject({ ...req.body }),
                query: sanitizeObject({ ...req.query }),
                params: sanitizeObject({ ...req.params }),
            });
            req.validated = {
                body: result.body ?? {},
                query: result.query ?? {},
                params: result.params ?? {},
            };
            next();
        }
        catch (err) {
            if (err instanceof ZodError) {
                return res.status(400).json({
                    message: "Validation Error",
                    errors: err.format(),
                });
            }
            next(err);
        }
    };
};
//# sourceMappingURL=globalZod.js.map