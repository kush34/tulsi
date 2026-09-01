import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { errorResponse } from "@/lib/utils/api-response";
import { createLogger } from "@/lib/logging";

const log = createLogger("middleware");

type RouteHandler = (req: NextRequest, context?: unknown) => Promise<NextResponse>;

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context?: unknown) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AppError) {
        log.warn({ err: error, path: req.nextUrl.pathname }, "Application error");
      } else {
        log.error({ err: error, path: req.nextUrl.pathname }, "Unhandled error");
      }
      return errorResponse(error);
    }
  };
}
