import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "@/lib/errors";

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const field = issue.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      throw new ValidationError(fieldErrors);
    }
    throw error;
  }
}

export function validateQuery<T>(schema: ZodSchema<T>, searchParams: URLSearchParams | Record<string, string>): T {
  const raw: Record<string, string> = {};
  if (searchParams instanceof URLSearchParams) {
    searchParams.forEach((value, key) => {
      raw[key] = value;
    });
  } else {
    Object.assign(raw, searchParams);
  }
  return validate(schema, raw);
}
