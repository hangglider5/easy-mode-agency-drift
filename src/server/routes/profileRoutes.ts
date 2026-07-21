import { Router } from "express";
import { z } from "zod";
import {
  CompareRequestSchema,
  CompareResponseSchema,
  CreateProfileRequestSchema,
  CreateProfileResponseSchema,
  DemoProfileResponseSchema,
  ManualModeResponseSchema,
  ReceiptResponseSchema,
} from "../../shared/apiSchemas";
import { parseRequest } from "../http";
import type { LedgerRepository } from "../repositories/ledgerRepository";
import type { ComparisonService } from "../services/comparisonService";
import type { DemoProfileService } from "../services/demoProfileService";
import type { ReceiptService } from "../services/receiptService";
import type { SweepService } from "../services/sweepService";

const ProfileParamsSchema = z.object({
  id: z.string().uuid(),
});

export function createProfileRoutes(deps: {
  ledger: LedgerRepository;
  sweepService: SweepService;
  comparisonService: ComparisonService;
  receiptService: ReceiptService;
  demoProfileService: DemoProfileService;
}): Router {
  const router = Router();

  router.post("/profiles", (request, response) => {
    const input = parseRequest(CreateProfileRequestSchema, request.body);
    const id = deps.ledger.createProfile(input.name);
    response.status(201).json(
      CreateProfileResponseSchema.parse({
        id,
        name: input.name,
        mode: "fresh",
        datesAreSimulated: false,
      }),
    );
  });

  router.post("/profiles/demo", (_request, response) => {
    response.status(201).json(
      DemoProfileResponseSchema.parse(deps.demoProfileService.createProfile()),
    );
  });

  router.get("/profiles/:id/state", (request, response) => {
    const { id } = parseRequest(ProfileParamsSchema, request.params);
    response.json(deps.sweepService.getState(id));
  });

  router.post("/profiles/:id/compare", async (request, response) => {
    const { id } = parseRequest(ProfileParamsSchema, request.params);
    const { decisionId } = parseRequest(CompareRequestSchema, request.body);
    response.json(
      CompareResponseSchema.parse(
        await deps.comparisonService.compareProfile(id, decisionId),
      ),
    );
  });

  router.get("/profiles/:id/receipt", (request, response) => {
    const { id } = parseRequest(ProfileParamsSchema, request.params);
    response.json(
      ReceiptResponseSchema.parse(deps.receiptService.createReceipt(id)),
    );
  });

  router.post("/profiles/:id/manual-mode", (request, response) => {
    const { id } = parseRequest(ProfileParamsSchema, request.params);
    response.json(
      ManualModeResponseSchema.parse(
        deps.demoProfileService.enableManualMode(id),
      ),
    );
  });

  return router;
}
