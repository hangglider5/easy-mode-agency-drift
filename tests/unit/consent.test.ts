import { describe, expect, it } from "vitest";
import { DomainEventSchema, type DomainEvent } from "../../src/domain/events";
import { assertCanDelegate, resolveConsent } from "../../src/domain/consent";

const profileId = "00000000-0000-4000-8000-000000000001";
const id = (suffix: number) =>
  `00000000-0000-4000-8000-${suffix.toString().padStart(12, "0")}`;

function grant(
  eventId: string,
  consentId: string,
  level: "recommend" | "preselect" | "decide" | "proxy",
  occurredAt: string,
): DomainEvent {
  return DomainEventSchema.parse({
    id: eventId,
    profileId,
    aggregateId: profileId,
    type: "consent_granted",
    actor: "human",
    occurredAt,
    payload: {
      consent: {
        id: consentId,
        profileId,
        category: "scheduling",
        level,
        grantedAt: occurredAt,
        revokedAt: null,
        sourceEventId: eventId,
      },
    },
  });
}

function revoke(
  eventId: string,
  consentId: string,
  occurredAt: string,
): DomainEvent {
  return DomainEventSchema.parse({
    id: eventId,
    profileId,
    aggregateId: profileId,
    type: "consent_revoked",
    actor: "human",
    occurredAt,
    payload: { consentId },
  });
}

describe("consent resolution", () => {
  it("returns no consent after the matching grant is revoked", () => {
    const consentId = id(2);
    const events = [
      grant(id(3), consentId, "proxy", "2026-07-01T00:00:00.000Z"),
      revoke(id(4), consentId, "2026-07-02T00:00:00.000Z"),
    ];

    expect(resolveConsent(events, "scheduling")).toBeNull();
  });

  it("uses the latest grant instead of preserving an older higher level", () => {
    const events = [
      grant(id(5), id(6), "proxy", "2026-07-01T00:00:00.000Z"),
      grant(id(7), id(8), "recommend", "2026-07-02T00:00:00.000Z"),
    ];

    expect(resolveConsent(events, "scheduling")?.level).toBe("recommend");
  });

  it("does not let revocation of an older grant cancel the current grant", () => {
    const oldConsentId = id(9);
    const currentConsentId = id(10);
    const events = [
      grant(id(11), oldConsentId, "proxy", "2026-07-01T00:00:00.000Z"),
      grant(
        id(12),
        currentConsentId,
        "decide",
        "2026-07-02T00:00:00.000Z",
      ),
      revoke(id(13), oldConsentId, "2026-07-03T00:00:00.000Z"),
    ];

    expect(resolveConsent(events, "scheduling")?.id).toBe(currentConsentId);
  });

  it("rejects delegation above the active consent level", () => {
    const consent = resolveConsent(
      [grant(id(14), id(15), "recommend", "2026-07-01T00:00:00.000Z")],
      "scheduling",
    );

    expect(() => assertCanDelegate("proxy", consent)).toThrow(
      /missing proxy consent/i,
    );
    expect(() => assertCanDelegate("recommend", consent)).not.toThrow();
  });
});
