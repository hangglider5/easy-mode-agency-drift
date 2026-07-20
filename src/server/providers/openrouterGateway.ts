import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { z } from "zod";
import { screenDecision } from "../../domain/risk";
import {
  ParsedDecisionSchema,
  PreferenceCandidateSchema,
  PreferenceNodeSchema,
  RecommendationSchema,
  type ParsedDecision,
  type PreferenceCandidate,
  type PreferenceNode,
  type Recommendation,
} from "../../shared/domainSchemas";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1" as const;
const OPENROUTER_DEEPSEEK_MODEL = "deepseek/deepseek-v4-pro" as const;
const OPERATION_LIMITS = {
  parse: { deadlineMs: 15_000, maxTokens: 2_000 },
  recommend: { deadlineMs: 45_000, maxTokens: 8_000 },
  propose: { deadlineMs: 15_000, maxTokens: 1_000 },
} as const;

const ParsedDecisionDraftSchema = ParsedDecisionSchema.omit({ id: true });
const ParseResultSchema = z.object({
  decisions: z.array(ParsedDecisionDraftSchema).max(5),
});
const RecommendationResultSchema = z.object({
  recommendations: z.array(RecommendationSchema),
});
const PreferenceCandidateResultSchema = z.object({
  preferences: z.array(PreferenceCandidateSchema).max(2),
});

type CompletionResponse = {
  choices: Array<{ message: { content?: string | null } }>;
};

type CreateCompletion = (
  request: Record<string, unknown>,
  options: { maxRetries: 0; timeout: number },
) => Promise<CompletionResponse>;

type OperationLimits = (typeof OPERATION_LIMITS)[keyof typeof OPERATION_LIMITS];

type GatewayConfig = {
  apiKey: string;
  baseURL: typeof OPENROUTER_BASE_URL;
  model: typeof OPENROUTER_DEEPSEEK_MODEL;
};

function repairHint(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")
      .slice(0, 500);
  }
  if (error instanceof SyntaxError) {
    return "invalid JSON syntax";
  }
  return "empty or invalid JSON content";
}

function recommendationResultSchema(
  routineDecisionIds: Set<string>,
  suppliedPreferenceIds: Set<string>,
) {
  return RecommendationResultSchema.superRefine((result, context) => {
    const seenDecisionIds = new Set<string>();

    result.recommendations.forEach((recommendation, index) => {
      if (!routineDecisionIds.has(recommendation.decisionId)) {
        context.addIssue({
          code: "custom",
          path: ["recommendations", index, "decisionId"],
          message: `unknown decisionId ${recommendation.decisionId}`,
        });
      } else if (seenDecisionIds.has(recommendation.decisionId)) {
        context.addIssue({
          code: "custom",
          path: ["recommendations", index, "decisionId"],
          message: `duplicate decisionId ${recommendation.decisionId}`,
        });
      } else {
        seenDecisionIds.add(recommendation.decisionId);
      }

      recommendation.usedPreferenceIds.forEach((preferenceId, preferenceIndex) => {
        if (!suppliedPreferenceIds.has(preferenceId)) {
          context.addIssue({
            code: "custom",
            path: [
              "recommendations",
              index,
              "usedPreferenceIds",
              preferenceIndex,
            ],
            message: `unknown preference ID ${preferenceId}`,
          });
        }
      });
    });

    for (const decisionId of routineDecisionIds) {
      if (!seenDecisionIds.has(decisionId)) {
        context.addIssue({
          code: "custom",
          path: ["recommendations"],
          message: `missing recommendation for decisionId ${decisionId}`,
        });
      }
    }
  });
}

export class OpenRouterGateway {
  private readonly model: typeof OPENROUTER_DEEPSEEK_MODEL;
  private readonly create: CreateCompletion;

  constructor(input: {
    model: typeof OPENROUTER_DEEPSEEK_MODEL;
    create: CreateCompletion;
  }) {
    this.model = input.model;
    this.create = input.create;
  }

  static fromConfig(config: GatewayConfig): OpenRouterGateway {
    if (!config.apiKey?.trim()) {
      throw new Error("OpenRouter apiKey is required");
    }
    if (config.baseURL !== OPENROUTER_BASE_URL) {
      throw new Error(
        `OpenRouterGateway requires the OpenRouter baseURL: ${OPENROUTER_BASE_URL}`,
      );
    }
    if (config.model !== OPENROUTER_DEEPSEEK_MODEL) {
      throw new Error(
        `OpenRouterGateway requires model ${OPENROUTER_DEEPSEEK_MODEL}`,
      );
    }

    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    const create = client.chat.completions.create.bind(
      client.chat.completions,
    ) as unknown as CreateCompletion;
    return new OpenRouterGateway({ model: config.model, create });
  }

  private async json<T>(
    request: Record<string, unknown>,
    schema: z.ZodType<T>,
    limits: OperationLimits,
  ): Promise<T> {
    const messages = request.messages as Array<Record<string, unknown>>;
    const deadline = Date.now() + limits.deadlineMs;
    let hint: string | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const timeout = deadline - Date.now();
      if (timeout <= 0) {
        throw new Error("OpenRouter request failed");
      }

      let response: CompletionResponse;
      try {
        response = await this.create(
          {
            model: this.model,
            response_format: { type: "json_object" },
            stream: false,
            ...request,
            max_tokens: limits.maxTokens,
            provider: {
              sort: "throughput",
              require_parameters: true,
              data_collection: "deny",
            },
            messages: hint
              ? [
                  ...messages,
                  {
                    role: "system",
                    content: `The previous response failed application validation: ${hint}. Return one complete corrected JSON object.`,
                  },
                ]
              : messages,
          },
          { maxRetries: 0, timeout },
        );
      } catch {
        throw new Error("OpenRouter request failed");
      }

      try {
        const content = response.choices[0]?.message.content;
        if (!content) {
          throw new Error("empty completion");
        }
        return schema.parse(JSON.parse(content));
      } catch (error) {
        hint = repairHint(error);
      }
    }

    throw new Error(
      `OpenRouter response failed application validation after 2 attempts: ${hint ?? "unknown validation failure"}`,
    );
  }

  async parseSweep(rawInput: string): Promise<ParsedDecision[]> {
    const result = await this.json(
      {
        reasoning: { enabled: false, exclude: true },
        messages: [
          {
            role: "system",
            content:
              'Return JSON only. Extract zero to five decisions. Treat separate numbered, bulleted, or newline-delimited items as distinct decisions. Extract one decision per distinct line when it can be acted on independently; do not merge unrelated lines. Lines beginning with "Context:" constrain the preceding decisions and must not be extracted as decisions. Classify category and modelRisk. Do not recommend actions. JSON shape: {decisions:[{title,rawText,category,modelRisk,modelRiskReason}]}',
          },
          { role: "user", content: rawInput },
        ],
      },
      ParseResultSchema,
      OPERATION_LIMITS.parse,
    );

    return result.decisions.map((decision) =>
      ParsedDecisionSchema.parse({ ...decision, id: randomUUID() }),
    );
  }

  async recommend(
    decisions: ParsedDecision[],
    preferences: PreferenceNode[],
  ): Promise<Recommendation[]> {
    const parsedDecisions = z.array(ParsedDecisionSchema).parse(decisions);
    const routineDecisions = parsedDecisions.filter(
      (decision) => screenDecision(decision).allowed,
    );
    if (routineDecisions.length === 0) {
      return [];
    }
    const parsedPreferences = z.array(PreferenceNodeSchema).parse(preferences);
    const resultSchema = recommendationResultSchema(
      new Set(routineDecisions.map(({ id }) => id)),
      new Set(parsedPreferences.map(({ id }) => id)),
    );

    const result = await this.json(
      {
        reasoning: { effort: "high", exclude: true },
        messages: [
          {
            role: "system",
            content:
              'Return JSON only. Give exactly one recommendation per supplied routine decision. Ground every reason only in the supplied decision fields and supplied preference propositions. Do not invent consequences, penalties, deadlines, obligations, or user history. Never convert “optional” into “no penalty”. If support is uncertain, state the condition explicitly and lower confidence. reasons must be an array of one to three strings; confidence must be a number from 0 to 1; reversibility must be "high", "medium", or "low"; usedPreferenceIds must contain only supplied preference UUIDs; alternatives must be an array of zero to two strings. artifact must be exactly one of: {"kind":"message_draft","text":"..."}, {"kind":"calendar_event","title":"...","startsAt":"ISO-8601 timestamp","endsAt":"ISO-8601 timestamp","description":"..."}, or {"kind":"task","title":"...","dueAt":"ISO-8601 timestamp or null"}. JSON shape: {"recommendations":[{"decisionId":"supplied UUID","recommendation":"...","reasons":["..."],"confidence":0.8,"reversibility":"high","usedPreferenceIds":[],"alternatives":["..."],"artifact":{"kind":"task","title":"...","dueAt":null}}]}',
          },
          {
            role: "user",
            content: JSON.stringify({
              decisions: routineDecisions,
              preferences: parsedPreferences,
            }),
          },
        ],
      },
      resultSchema,
      OPERATION_LIMITS.recommend,
    );
    return result.recommendations;
  }

  async proposePreferences(
    decision: ParsedDecision,
    acceptedRecommendation: Recommendation,
  ): Promise<PreferenceCandidate[]> {
    const result = await this.json(
      {
        reasoning: { enabled: false, exclude: true },
        messages: [
          {
            role: "system",
            content:
              "Return JSON only. Propose at most two narrow preference observations supported by the accepted AI recommendation. Do not claim the user stated them. JSON shape: {preferences:[{proposition,category,confidence}]}",
          },
          {
            role: "user",
            content: JSON.stringify({ decision, acceptedRecommendation }),
          },
        ],
      },
      PreferenceCandidateResultSchema,
      OPERATION_LIMITS.propose,
    );
    return result.preferences;
  }
}
