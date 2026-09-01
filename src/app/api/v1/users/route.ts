import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware";
import { successResponse } from "@/lib/utils/api-response";
import { db } from "@/db";
import { paginationSchema, getSkip, getTotalPages, buildOrderBy } from "@/lib/utils/pagination";
import { filterSchema, buildWhereClause } from "@/lib/utils/filtering";
import { validateQuery } from "@/lib/validators";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;

  const pagination = validateQuery(paginationSchema, searchParams);
  const rawFilters: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (!["page", "limit", "sortBy", "sortOrder"].includes(key)) {
      rawFilters[key] = value;
    }
  });
  const filters = validateQuery(filterSchema, rawFilters);

  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(pagination.sortBy, pagination.sortOrder);

  const [data, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy,
      skip: getSkip(pagination.page, pagination.limit),
      take: pagination.limit,
    }),
    db.user.count({ where }),
  ]);

  return successResponse(data, 200, {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: getTotalPages(total, pagination.limit),
  });
});
