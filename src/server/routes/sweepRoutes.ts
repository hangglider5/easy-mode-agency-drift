import { Router } from "express";
import { z } from "zod";
import {
  AcceptDecisionRequestSchema,
  CreateSweepRequestSchema,
  PreferenceResolutionRequestSchema,
} from "../../shared/apiSchemas";
import { parseRequest } from "../http";
import { renderIcs } from "../services/actionArtifactService";
import type { SweepService } from "../services/sweepService";

const DecisionParamsSchema = z.object({
  id: z.string().uuid(),
});

const ProfileIdRequestSchema = z.object({
  profileId: z.string().uuid(),
});

const ArtifactParamsSchema = z.object({
  eventId: z.string().uuid(),
});

export function createSweepRoutes(deps: {
  sweepService: SweepService;
}): Router {
  const router = Router();

  router.post("/sweeps", async (request, response) => {
    const input = parseRequest(CreateSweepRequestSchema, request.body);
    const result = await deps.sweepService.createSweep(
      input.profileId,
      input.rawInput,
    );
    response.status(201).json(result);
  });

  router.post("/decisions/:id/alternatives", (request, response) => {
    const { id } = parseRequest(DecisionParamsSchema, request.params);
    const { profileId } = parseRequest(ProfileIdRequestSchema, request.body);
    response.json(deps.sweepService.getAlternatives(profileId, id));
  });

  router.post("/decisions/:id/accept", async (request, response) => {
    const { id } = parseRequest(DecisionParamsSchema, request.params);
    const input = parseRequest(AcceptDecisionRequestSchema, request.body);
    response.json(
      await deps.sweepService.acceptDecision({
        profileId: input.profileId,
        decisionId: id,
        idempotencyKey: input.idempotencyKey,
      }),
    );
  });

  router.post("/preferences/:id/resolve", (request, response) => {
    const { id } = parseRequest(DecisionParamsSchema, request.params);
    const input = parseRequest(
      PreferenceResolutionRequestSchema,
      request.body,
    );
    response.json(
      deps.sweepService.resolvePreference({
        profileId: input.profileId,
        preferenceId: id,
        resolution: input.resolution,
        editedProposition: input.editedProposition,
      }),
    );
  });

  router.get("/artifacts/:eventId/calendar.ics", (request, response) => {
    const { eventId } = parseRequest(ArtifactParamsSchema, request.params);
    const stored = deps.sweepService.getCalendarArtifact(eventId);
    response
      .status(200)
      .type("text/calendar")
      .set(
        "Content-Disposition",
        `attachment; filename="easy-mode-${eventId}.ics"`,
      )
      .send(
        renderIcs(stored.artifact, {
          eventId: stored.eventId,
          occurredAt: stored.occurredAt,
        }),
      );
  });

  return router;
}
