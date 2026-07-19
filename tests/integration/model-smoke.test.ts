// @vitest-environment node

import { config as loadDotenv } from "dotenv";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { loadConfig } from "../../src/server/config";
import { OpenRouterGateway } from "../../src/server/providers/openrouterGateway";
import {
  ParsedDecisionSchema,
  RecommendationSchema,
} from "../../src/shared/domainSchemas";

if (process.env.RUN_MODEL_SMOKE === "1") {
  loadDotenv({ quiet: true });
}

describe.runIf(process.env.RUN_MODEL_SMOKE === "1")(
  "OpenRouter DeepSeek live model smoke",
  () => {
    it(
      "parses and recommends for one routine two-decision sweep",
      async () => {
        const gateway = OpenRouterGateway.fromConfig(
          loadConfig(process.env).openrouter,
        );
        const decisions = await gateway.parseSweep(
          "Choose a quick vegetarian lunch for today. Also decide whether I should send the short project update now or after lunch.",
        );

        z.array(ParsedDecisionSchema).length(2).parse(decisions);

        const recommendations = await gateway.recommend(decisions, []);

        expect(
          z
            .array(RecommendationSchema)
            .length(decisions.length)
            .safeParse(recommendations).success,
        ).toBe(true);
      },
      120_000,
    );
  },
);
