// @vitest-environment node

import { describe, expect, it } from "vitest";
import { buildLineage, getSyntheticDepth } from "../../src/domain/lineage";
import { calculateReceiptFromEvents } from "../../src/server/services/receiptService";
import {
  createDemoProfileEvents,
  readDemoReveal,
} from "../../src/server/fixtures/demoProfile";

const profileId = "20000000-0000-4000-8000-000000000001";
const anchor = "2026-07-01T09:00:00.000Z";

describe("deterministic Demo Profile", () => {
  it("replays the designed receipt metrics and a three-level synthetic lineage", () => {
    const events = createDemoProfileEvents(profileId, anchor);
    const graph = buildLineage(events);
    const receipt = calculateReceiptFromEvents(events);

    expect(Math.round(receipt.metrics.aiOriginatedPreferenceRatio * 100)).toBe(
      73,
    );
    expect(Math.round(receipt.metrics.proxyDivergence * 100)).toBe(68);
    expect(Math.round(receipt.metrics.humanInitiationRatio * 100)).toBe(11);
    expect(receipt.metrics.consentCompleteness).toBe(1);
    expect(receipt.metrics.unauthorizedDecisionCount).toBe(0);
    expect(
      Math.max(
        ...[...graph.nodes.values()].map((node) =>
          getSyntheticDepth(node.id, graph),
        ),
      ),
    ).toBeGreaterThanOrEqual(3);
  });

  it("produces stable IDs and a stored Proxy reveal without a provider", () => {
    const first = createDemoProfileEvents(profileId, anchor);
    const second = createDemoProfileEvents(profileId, anchor);
    const reveal = readDemoReveal(first);

    expect(second).toEqual(first);
    expect(reveal.comparison).toMatchObject({
      diverged: true,
      humanConsulted: false,
      declared: { recommendation: expect.stringMatching(/planning call/i) },
      proxy: { recommendation: expect.stringMatching(/focus block/i) },
    });
    expect(reveal.lineage.nodes).toHaveLength(3);
    expect(reveal.lineage.nodes[0]?.sourceType).toBe("proxy_generated");
  });
});
