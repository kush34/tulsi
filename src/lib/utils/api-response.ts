import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    errors?: Record<string, string[]>;
  };
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function successResponse<T>(data: T, status = 200, meta?: PaginationMeta): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) }, { status });
}

export function errorResponse(error: unknown): NextResponse<ApiResponse> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error instanceof AppError && "errors" in error
            ? { errors: (error as import("@/lib/errors").ValidationError).errors }
            : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  console.error("Unhandled error:", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}
