import { z, ZodObject, ZodRawShape, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import mongoSanitize from "mongo-sanitize";

// Default schema: allow any object by default
const defaultSchema: ZodObject<ZodRawShape> = z.object({
  body: z.record(z.string(), z.any()).optional(),
  query: z.record(z.string(), z.any()).optional(),
  params: z.record(z.string(), z.any()).optional(),
});

// Recursively sanitize
const sanitizeObject = <T>(obj: T): T => {
  if (typeof obj !== "object" || obj === null) return obj;
  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      obj[key] = sanitizeObject(obj[key]);
    } else {
      obj[key] = mongoSanitize(obj[key]);
    }
  }
  return obj;
};

// Global middleware
export const globalZodMiddleware = (schemas?: { [path: string]: ZodObject<ZodRawShape> }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = (schemas && schemas[req.path]) || defaultSchema;

      const result = schema.parse({
        body: sanitizeObject({ ...req.body }),
        query: sanitizeObject({ ...req.query }),
        params: sanitizeObject({ ...req.params }),
      });

      // Attach validated object safely
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
};