import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import express, {
  type ErrorRequestHandler,
  type Express,
  type RequestHandler,
} from "express";
import type { LedgerRepository } from "./repositories/ledgerRepository";
import { ApiError } from "./http";
import { createProfileRoutes } from "./routes/profileRoutes";
import { createSweepRoutes } from "./routes/sweepRoutes";
import { ComparisonService } from "./services/comparisonService";
import { ReceiptService } from "./services/receiptService";
import {
  SweepService,
  type SweepGateway,
} from "./services/sweepService";

type ErrorShape = {
  status?: number;
  type?: string;
};

export function createApp(deps: {
  ledger: LedgerRepository;
  openrouter: SweepGateway;
  clientDistPath?: string | false;
}): Express {
  const app = express();
  const sweepService = new SweepService({
    ledger: deps.ledger,
    openrouter: deps.openrouter,
  });
  const comparisonService = new ComparisonService({
    ledger: deps.ledger,
    openrouter: deps.openrouter,
  });
  const receiptService = new ReceiptService(deps.ledger);

  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/health", (request, response) => {
    response.json({
      ok: true,
      requestId: response.locals.requestId as string,
    });
  });
  app.use(
    "/api",
    createProfileRoutes({
      ledger: deps.ledger,
      sweepService,
      comparisonService,
      receiptService,
    }),
  );
  app.use("/api", createSweepRoutes({ sweepService }));

  app.use("/api", (_request, _response, next) => {
    next(new ApiError(404, "route_not_found", "Route not found"));
  });

  const clientDistPath =
    deps.clientDistPath === false
      ? undefined
      : deps.clientDistPath ??
        (process.env.NODE_ENV === "production"
          ? resolve(process.cwd(), "dist/client")
          : undefined);
  if (clientDistPath && existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.use((request, response, next) => {
      if (
        request.method === "GET" &&
        request.accepts("html") &&
        !request.path.startsWith("/api/")
      ) {
        response.sendFile(resolve(clientDistPath, "index.html"));
        return;
      }
      next();
    });
  }

  app.use((_request, _response, next) => {
    next(new ApiError(404, "route_not_found", "Route not found"));
  });
  app.use(errorHandler);
  return app;
}

const requestIdMiddleware: RequestHandler = (_request, response, next) => {
  const requestId = randomUUID();
  response.locals.requestId = requestId;
  response.set("X-Request-Id", requestId);
  next();
};

const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  const requestId =
    typeof response.locals.requestId === "string"
      ? response.locals.requestId
      : randomUUID();
  response.set("X-Request-Id", requestId);

  if (error instanceof ApiError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.publicMessage,
        requestId,
      },
    });
    return;
  }

  const shaped = error as ErrorShape;
  if (shaped?.type === "entity.too.large" || shaped?.status === 413) {
    response.status(413).json({
      error: {
        code: "payload_too_large",
        message: "Request body is too large",
        requestId,
      },
    });
    return;
  }
  if (
    shaped?.type === "entity.parse.failed" ||
    (error instanceof SyntaxError && shaped?.status === 400)
  ) {
    response.status(400).json({
      error: {
        code: "invalid_json",
        message: "Invalid JSON body",
        requestId,
      },
    });
    return;
  }

  response.status(500).json({
    error: {
      code: "internal_error",
      message: "The request could not be completed",
      requestId,
    },
  });
};
