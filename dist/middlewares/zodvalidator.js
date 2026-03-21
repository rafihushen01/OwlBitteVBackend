import { ZodError } from "zod";
import mongoSanitize from "mongo-sanitize";
export const validate = (schema) => (req, res, next) => {
    try {
        const result = schema.parse({
            body: mongoSanitize({ ...req.body }),
            query: mongoSanitize({ ...req.query }),
            params: mongoSanitize({ ...req.params }),
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
//# sourceMappingURL=zodvalidator.js.map