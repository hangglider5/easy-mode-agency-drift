import { z } from "zod";
import type { DomainEvent } from "./events";
import {
  ConsentGrantSchema,
  type ConsentGrant,
} from "../shared/domainSchemas";

const ConsentGrantedPayloadSchema = z.object({
  consent: ConsentGrantSchema,
});

const ConsentRevokedPayloadSchema = z.object({
  consentId: z.string().uuid(),
});

const rank = {
  recommend: 0,
  preselect: 1,
  decide: 2,
  proxy: 3,
} as const;

export function resolveConsent(
  events: readonly DomainEvent[],
  category: ConsentGrant["category"],
): ConsentGrant | null {
  const grantsById = new Map<string, ConsentGrant>();
  const currentByCategory = new Map<
    ConsentGrant["category"],
    ConsentGrant | null
  >();

  for (const event of events) {
    if (event.type === "consent_granted") {
      const { consent } = ConsentGrantedPayloadSchema.parse(event.payload);
      grantsById.set(consent.id, consent);
      currentByCategory.set(
        consent.category,
        consent.revokedAt === null ? consent : null,
      );
    }

    if (event.type === "consent_revoked") {
      const { consentId } = ConsentRevokedPayloadSchema.parse(event.payload);
      const grant = grantsById.get(consentId);
      if (
        grant &&
        currentByCategory.get(grant.category)?.id === consentId
      ) {
        currentByCategory.set(grant.category, null);
      }
    }
  }

  return currentByCategory.get(category) ?? null;
}

export function assertCanDelegate(
  level: ConsentGrant["level"],
  consent: ConsentGrant | null,
): void {
  if (!consent || rank[consent.level] < rank[level]) {
    throw new Error(`Missing ${level} consent`);
  }
}
