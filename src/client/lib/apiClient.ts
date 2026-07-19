import { z } from "zod";
import {
  AcceptDecisionResponseSchema,
  AlternativesResponseSchema,
  ConsentResponseSchema,
  CreateProfileResponseSchema,
  CreateSweepResponseSchema,
  PreferenceResolutionResponseSchema,
  type AcceptDecisionResponse,
  type AlternativesResponse,
  type CreateSweepResponse,
} from "../../shared/apiSchemas";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnsupportedApiError extends Error {
  constructor(feature: string) {
    super(`${feature} is not available in this build.`);
    this.name = "UnsupportedApiError";
  }
}

const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
  }),
});

async function requestJson<T>(
  path: string,
  init: RequestInit,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsedError = ErrorResponseSchema.safeParse(body);
    throw new ApiError(
      parsedError.success ? parsedError.data.error.message : "Request failed",
      response.status,
      parsedError.success ? parsedError.data.error.code : "request_failed",
    );
  }
  return schema.parse(body);
}

export type DecisionSweepApi = {
  createSweep(profileId: string, rawInput: string): Promise<CreateSweepResponse>;
  requestAlternatives(
    profileId: string,
    decisionId: string,
  ): Promise<AlternativesResponse>;
  acceptDecision(
    profileId: string,
    decisionId: string,
  ): Promise<AcceptDecisionResponse>;
};

const acceptanceKeys = new Map<string, string>();

export const apiClient = {
  createProfile(name: string) {
    return requestJson(
      "/api/profiles",
      { method: "POST", body: JSON.stringify({ name }) },
      CreateProfileResponseSchema,
    );
  },

  createSweep(profileId: string, rawInput: string) {
    return requestJson(
      "/api/sweeps",
      { method: "POST", body: JSON.stringify({ profileId, rawInput }) },
      CreateSweepResponseSchema,
    );
  },

  requestAlternatives(profileId: string, decisionId: string) {
    return requestJson(
      `/api/decisions/${encodeURIComponent(decisionId)}/alternatives`,
      { method: "POST", body: JSON.stringify({ profileId }) },
      AlternativesResponseSchema,
    );
  },

  acceptDecision(profileId: string, decisionId: string) {
    const acceptance = `${profileId}:${decisionId}`;
    const idempotencyKey = acceptanceKeys.get(acceptance) ?? crypto.randomUUID();
    acceptanceKeys.set(acceptance, idempotencyKey);
    return requestJson(
      `/api/decisions/${encodeURIComponent(decisionId)}/accept`,
      {
        method: "POST",
        body: JSON.stringify({
          profileId,
          idempotencyKey,
        }),
      },
      AcceptDecisionResponseSchema,
    );
  },

  resolvePreference(
    profileId: string,
    preferenceId: string,
    resolution: "confirm" | "reject" | "retract",
    editedProposition?: string,
  ) {
    return requestJson(
      `/api/preferences/${encodeURIComponent(preferenceId)}/resolve`,
      {
        method: "POST",
        body: JSON.stringify({ profileId, resolution, editedProposition }),
      },
      PreferenceResolutionResponseSchema,
    );
  },

  grantConsent(): Promise<never> {
    return Promise.reject(new UnsupportedApiError("Consent controls"));
  },
  revokeConsent(): Promise<never> {
    return Promise.reject(new UnsupportedApiError("Consent controls"));
  },
  compareProfile(): Promise<never> {
    return Promise.reject(new UnsupportedApiError("Profile comparison"));
  },
  getReceipt(): Promise<never> {
    return Promise.reject(new UnsupportedApiError("Consent receipts"));
  },
  resetProfile(): Promise<never> {
    return Promise.reject(new UnsupportedApiError("Profile reset"));
  },
  deleteProfile(): Promise<never> {
    return Promise.reject(new UnsupportedApiError("Profile deletion"));
  },
} satisfies DecisionSweepApi & {
  createProfile(name: string): Promise<z.infer<typeof CreateProfileResponseSchema>>;
  resolvePreference(
    profileId: string,
    preferenceId: string,
    resolution: "confirm" | "reject" | "retract",
    editedProposition?: string,
  ): Promise<z.infer<typeof PreferenceResolutionResponseSchema>>;
  grantConsent(): Promise<z.infer<typeof ConsentResponseSchema>> | Promise<never>;
  revokeConsent(): Promise<never>;
  compareProfile(): Promise<never>;
  getReceipt(): Promise<never>;
  resetProfile(): Promise<never>;
  deleteProfile(): Promise<never>;
};
