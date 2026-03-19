import { ZodSchema, ZodError, ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";
import mongoSanitize from "mongo-sanitize";

// Use generic T for schema type
export const validate = <T extends ZodTypeAny>(schema: T) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = schema.parse({
      body: mongoSanitize({ ...req.body }),
      query: mongoSanitize({ ...req.query }),
      params: mongoSanitize({ ...req.params }),
    }) as z.infer<T>; // <-- tell TypeScript the type

    (req as any).validated = {
      body: result.body ?? {},
      query: result.query ?? {},
      params: result.params ?? {},
    };

    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation Error",
        errors: err.format(),
      });
    }
    next(err);
  }
};