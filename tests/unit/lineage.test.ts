import { describe, expect, it } from "vitest";
import { DomainEventSchema, type DomainEvent } from "../../src/domain/events";
import {
  buildLineage,
  getSyntheticDepth,
  validateNewPreference,
  type PreferenceGraph,
} from "../../src/domain/lineage";
import {
  PreferenceNodeSchema,
  type PreferenceNode,
} from "../../src/shared/domainSchemas";

const profileId = "00000000-0000-4000-8000-000000000001";
const id = (suffix: number) =>
  `00000000-0000-4000-8000-${suffix.toString().padStart(12, "0")}`;

function preference(
  preferenceId: string,
  sourceEventId: string,
  overrides: Partial<PreferenceNode> = {},
): PreferenceNode {
  return PreferenceNodeSchema.parse({
    id: preferenceId,
    proposition: "Prefers solitude",
    category: "scheduling",
    sourceType: "accepted_ai_recommendation",
    sourceEventIds: [sourceEventId],
    parentPreferenceIds: [],
    confidence: 0.7,
    status: "active",
    ...overrides,
  });
}

function graph(nodes: PreferenceNode[]): PreferenceGraph {
  return {
    nodes: new Map(nodes.map((node) => [node.id, node])),
    usedBy: new Map(),
    relations: [],
  };
}

function event(
  eventId: string,
  type: DomainEvent["type"],
  payload: unknown,
  occurredAt = "2026-07-01T00:00:00.000Z",
): DomainEvent {
  return DomainEventSchema.parse({
    id: eventId,
    profileId,
    aggregateId: profileId,
    type,
    actor: "human",
    occurredAt,
    payload,
  });
}

describe("preference lineage", () => {
  it("preserves AI ancestry after human confirmation", () => {
    const preferenceId = id(2);
    const sourceEventId = id(3);
    const events = [
      DomainEventSchema.parse({
        id: sourceEventId,
        profileId,
        aggregateId: profileId,
        type: "preference_proposed",
        actor: "system",
        occurredAt: "2026-07-01T00:00:00.000Z",
        payload: {
          preference: preference(preferenceId, sourceEventId),
        },
      }),
      DomainEventSchema.parse({
        id: id(4),
        profileId,
        aggregateId: profileId,
        type: "preference_confirmed",
        actor: "human",
        occurredAt: "2026-07-02T00:00:00.000Z",
        payload: { preferenceId },
      }),
    ];

    const lineage = buildLineage(events);

    expect(Object.isFrozen(events[0].payload)).toBe(true);
    expect(lineage.nodes.get(preferenceId)?.sourceType).toBe(
      "accepted_ai_recommendation",
    );
  });

  it("rejects a direct self-cycle", () => {
    const preferenceId = id(5);

    expect(() =>
      validateNewPreference(
        { id: preferenceId, parentPreferenceIds: [preferenceId] },
        new Map(),
      ),
    ).toThrow(/cycle/i);
  });

  it("rejects a multi-node cycle", () => {
    const candidateId = id(6);
    const firstId = id(7);
    const secondId = id(8);
    const nodes = new Map([
      [
        firstId,
        preference(firstId, id(9), { parentPreferenceIds: [secondId] }),
      ],
      [
        secondId,
        preference(secondId, id(10), {
          parentPreferenceIds: [candidateId],
        }),
      ],
    ]);

    expect(() =>
      validateNewPreference(
        { id: candidateId, parentPreferenceIds: [firstId] },
        nodes,
      ),
    ).toThrow(/cycle/i);
  });

  it("computes synthetic depth across AI-derived ancestry", () => {
    const root = preference(id(11), id(12), {
      sourceType: "explicit_user_statement",
    });
    const child = preference(id(13), id(14), {
      parentPreferenceIds: [root.id],
    });
    const grandchild = preference(id(15), id(16), {
      sourceType: "derived_from_preferences",
      parentPreferenceIds: [child.id],
    });

    const lineage = graph([root, child, grandchild]);

    expect(getSyntheticDepth(root.id, lineage)).toBe(0);
    expect(getSyntheticDepth(child.id, lineage)).toBe(1);
    expect(getSyntheticDepth(grandchild.id, lineage)).toBe(2);
  });

  it("rejects cyclic graphs during depth calculation without overflowing", () => {
    const firstId = id(17);
    const secondId = id(18);
    const lineage = graph([
      preference(firstId, id(19), { parentPreferenceIds: [secondId] }),
      preference(secondId, id(20), { parentPreferenceIds: [firstId] }),
    ]);

    expect(() => getSyntheticDepth(firstId, lineage)).toThrow(/cycle/i);
  });

  it("replays status changes, relations, and decision usage", () => {
    const firstPreferenceId = id(21);
    const secondPreferenceId = id(22);
    const firstEventId = id(23);
    const secondEventId = id(24);
    const decisionId = id(25);
    const events = [
      DomainEventSchema.parse({
        id: firstEventId,
        profileId,
        aggregateId: profileId,
        type: "preference_proposed",
        actor: "system",
        occurredAt: "2026-07-01T00:00:00.000Z",
        payload: {
          preference: preference(firstPreferenceId, firstEventId),
        },
      }),
      DomainEventSchema.parse({
        id: secondEventId,
        profileId,
        aggregateId: profileId,
        type: "preference_proposed",
        actor: "system",
        occurredAt: "2026-07-02T00:00:00.000Z",
        payload: {
          preference: preference(secondPreferenceId, secondEventId, {
            parentPreferenceIds: [firstPreferenceId],
          }),
        },
      }),
      DomainEventSchema.parse({
        id: id(26),
        profileId,
        aggregateId: profileId,
        type: "preference_superseded",
        actor: "human",
        occurredAt: "2026-07-03T00:00:00.000Z",
        payload: {
          preferenceId: firstPreferenceId,
          supersededById: secondPreferenceId,
        },
      }),
      DomainEventSchema.parse({
        id: id(27),
        profileId,
        aggregateId: decisionId,
        type: "recommendation_generated",
        actor: "deepseek",
        occurredAt: "2026-07-04T00:00:00.000Z",
        payload: { usedPreferenceIds: [secondPreferenceId] },
      }),
    ];

    const lineage = buildLineage(events);

    expect(lineage.nodes.get(firstPreferenceId)?.status).toBe("superseded");
    expect(lineage.relations).toEqual([
      {
        from: secondPreferenceId,
        to: firstPreferenceId,
        kind: "derived_from",
      },
      {
        from: firstPreferenceId,
        to: secondPreferenceId,
        kind: "supersedes",
      },
    ]);
    expect(lineage.usedBy.get(secondPreferenceId)).toEqual(
      new Set([decisionId]),
    );
  });

  it("marks a preference unverified when its evidence is missing", () => {
    const eventId = id(28);
    const missingEventId = id(29);
    const preferenceId = id(30);

    const lineage = buildLineage([
      DomainEventSchema.parse({
        id: eventId,
        profileId,
        aggregateId: profileId,
        type: "preference_proposed",
        actor: "system",
        occurredAt: "2026-07-01T00:00:00.000Z",
        payload: {
          preference: preference(preferenceId, missingEventId),
        },
      }),
    ]);

    expect(lineage.nodes.get(preferenceId)?.status).toBe("unverified");
  });

  it("rejects a later proposal that would overwrite and reactivate an identity", () => {
    const parentPreferenceId = id(31);
    const parentEventId = id(32);
    const preferenceId = id(33);
    const proposalEventId = id(34);
    const duplicateEventId = id(37);
    const events = [
      event(
        parentEventId,
        "preference_proposed",
        {
          preference: preference(parentPreferenceId, parentEventId, {
            sourceType: "explicit_user_statement",
          }),
        },
      ),
      event(proposalEventId, "preference_proposed", {
        preference: preference(preferenceId, proposalEventId),
      }),
      event(id(35), "preference_confirmed", { preferenceId }),
      event(id(36), "preference_retracted", { preferenceId }),
      event(duplicateEventId, "preference_proposed", {
        preference: preference(preferenceId, duplicateEventId, {
          proposition: "Replacement proposition",
          sourceType: "explicit_user_statement",
          parentPreferenceIds: [parentPreferenceId],
          status: "active",
        }),
      }),
    ];

    expect(() => buildLineage(events)).toThrow(/duplicate preference id/i);
  });

  it("rejects an identical duplicate proposal instead of treating it as an event retry", () => {
    const preferenceId = id(38);
    const firstEventId = id(39);
    const duplicateEventId = id(40);
    const node = preference(preferenceId, firstEventId);

    expect(() =>
      buildLineage([
        event(firstEventId, "preference_proposed", { preference: node }),
        event(duplicateEventId, "preference_proposed", { preference: node }),
      ]),
    ).toThrow(/duplicate preference id/i);
  });

  it.each([
    {
      type: "preference_rejected" as const,
      expectedStatus: "retracted" as const,
      targetKey: null,
    },
    {
      type: "preference_retracted" as const,
      expectedStatus: "retracted" as const,
      targetKey: null,
    },
    {
      type: "preference_contradicted" as const,
      expectedStatus: "contradicted" as const,
      targetKey: "contradictingPreferenceId" as const,
    },
    {
      type: "preference_superseded" as const,
      expectedStatus: "superseded" as const,
      targetKey: "supersededById" as const,
    },
  ])(
    "applies later $type events in ledger order and keeps the terminal status after confirmation",
    ({ type, expectedStatus, targetKey }) => {
      const preferenceId = id(41);
      const proposalEventId = id(42);
      const targetPreferenceId = id(43);
      const terminalPayload: Record<string, string> = { preferenceId };
      if (targetKey) terminalPayload[targetKey] = targetPreferenceId;

      const lineage = buildLineage([
        event(
          proposalEventId,
          "preference_proposed",
          { preference: preference(preferenceId, proposalEventId) },
          "2026-07-02T00:00:00.000Z",
        ),
        event(
          id(44),
          type,
          terminalPayload,
          "2026-07-01T00:00:00.000Z",
        ),
        event(id(45), "preference_confirmed", { preferenceId }),
      ]);

      expect(lineage.nodes.get(preferenceId)?.status).toBe(expectedStatus);
    },
  );
});
