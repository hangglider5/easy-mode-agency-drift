import { Router } from "express";
import { z } from "zod";
import {
  CompareRequestSchema,
  CompareResponseSchema,
  CreateProfileRequestSchema,
  CreateProfileResponseSchema,
} from "../../shared/apiSchemas";
import { parseRequest } from "../http";
import type { LedgerRepository } from "../repositories/ledgerRepository";
import type { ComparisonService } from "../services/comparisonService";
import type { SweepService } from "../services/sweepService";

const ProfileParamsSchema = z.object({
  id: z.string().uuid(),
});

export function createProfileRoutes(deps: {
  ledger: LedgerRepository;
  sweepService: SweepService;
  comparisonService: ComparisonService;
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

  return router;
}
