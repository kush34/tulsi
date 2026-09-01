import { z } from "zod";

export const filterSchema = z.record(z.string(), z.string());

export type FilterInput = z.infer<typeof filterSchema>;

export interface WhereClause {
  [key: string]:
    | string
    | number
    | boolean
    | { contains: string; mode: "insensitive" }
    | { equals: string | number | boolean }
    | { in: (string | number)[] }
    | { gte?: string | number; lte?: string | number };
}

export function buildWhereClause(filters: FilterInput): WhereClause {
  const where: WhereClause = {};

  for (const [key, value] of Object.entries(filters)) {
    if (key.endsWith("_contains")) {
      const field = key.replace("_contains", "");
      where[field] = { contains: value, mode: "insensitive" };
    } else if (key.endsWith("_gte")) {
      const field = key.replace("_gte", "");
      const existing = where[field] as { gte?: string | number; lte?: string | number } | undefined;
      where[field] = { ...existing, gte: value };
    } else if (key.endsWith("_lte")) {
      const field = key.replace("_lte", "");
      const existing = where[field] as { gte?: string | number; lte?: string | number } | undefined;
      where[field] = { ...existing, lte: value };
    } else if (key.endsWith("_in")) {
      const field = key.replace("_in", "");
      where[field] = { in: value.split(",") };
    } else {
      where[key] = { equals: value };
    }
  }

  return where;
}
