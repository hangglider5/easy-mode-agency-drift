import { randomUUID } from "node:crypto";
import { resolveConsent } from "../../domain/consent";
import { DomainEventSchema } from "../../domain/events";
import { replayProfile } from "../../domain/replay";
import {
  DemoProfileResponseSchema,
  ManualModeResponseSchema,
  type DemoProfileResponse,
  type ManualModeResponse,
} from "../../shared/apiSchemas";
import { DecisionCategorySchema } from "../../shared/domainSchemas";
import { ApiError } from "../http";
import type { LedgerRepository } from "../repositories/ledgerRepository";
import {
  createDemoProfileEvents,
  demoDecisionId,
  readDemoDrift,
  readDemoReveal,
} from "../fixtures/demoProfile";

export class DemoProfileService {
  constructor(private readonly ledger: LedgerRepository) {}

  createProfile(): DemoProfileResponse {
    const id = this.ledger.createProfile("Alex");
    const events = createDemoProfileEvents(id);
    this.ledger.appendMany(events);
    return DemoProfileResponseSchema.parse({
      id,
      name: "Alex",
      mode: "demo",
      datesAreSimulated: true,
      decisionId: demoDecisionId(id),
      drift: readDemoDrift(events),
      reveal: readDemoReveal(events),
    });
  }

  enableManualMode(profileId: string): ManualModeResponse {
    if (!this.ledger.getProfile(profileId)) {
      throw new ApiError(404, "profile_not_found", "Profile not found");
    }
    const activeEvents = replayProfile(this.ledger.list(profileId)).activeEvents;
    const activeProxyConsents = DecisionCategorySchema.options.flatMap(
      (category) => {
        const consent = resolveConsent(activeEvents, category);
        return consent?.level === "proxy" ? [consent] : [];
      },
    );
    const occurredAt = new Date().toISOString();
    const revokedConsentIds = activeProxyConsents.map(({ id }) => id);
    this.ledger.appendMany([
      ...activeProxyConsents.map((consent) =>
        DomainEventSchema.parse({
          id: randomUUID(),
          profileId,
          aggregateId: consent.id,
          type: "consent_revoked",
          actor: "human",
          occurredAt,
          payload: { consentId: consent.id },
        }),
      ),
      DomainEventSchema.parse({
        id: randomUUID(),
        profileId,
        aggregateId: profileId,
        type: "manual_mode_enabled",
        actor: "human",
        occurredAt,
        payload: { revokedConsentIds },
      }),
    ]);
    return ManualModeResponseSchema.parse({
      manualMode: true,
      revokedConsentIds,
    });
  }
}
