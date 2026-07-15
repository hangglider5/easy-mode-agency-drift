import { z } from "zod";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | JsonObject;

export type JsonObject = { readonly [key: string]: JsonValue };

class InvalidJsonValueError extends Error {}

function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneJsonValue(
  value: unknown,
  ancestors: WeakSet<object>,
  path: string,
): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new InvalidJsonValueError(`${path} must contain a finite number`);
    }
    return Object.is(value, -0) ? 0 : value;
  }

  if (typeof value !== "object") {
    throw new InvalidJsonValueError(`${path} contains a non-JSON value`);
  }

  if (ancestors.has(value)) {
    throw new InvalidJsonValueError(`${path} contains a circular reference`);
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const clone: JsonValue[] = [];
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
          throw new InvalidJsonValueError(
            `${path}[${index}] must be an enumerable JSON value`,
          );
        }
        clone.push(
          cloneJsonValue(descriptor.value, ancestors, `${path}[${index}]`),
        );
      }

      for (const key of Reflect.ownKeys(value)) {
        const numericKey = typeof key === "string" ? Number(key) : Number.NaN;
        const isPreservedIndex =
          typeof key === "string" &&
          Number.isInteger(numericKey) &&
          numericKey >= 0 &&
          numericKey < value.length &&
          String(numericKey) === key;
        if (key !== "length" && !isPreservedIndex) {
          throw new InvalidJsonValueError(
            `${path} contains a property JSON arrays cannot preserve`,
          );
        }
      }
      return Object.freeze(clone);
    }

    if (!isPlainObject(value)) {
      throw new InvalidJsonValueError(`${path} must contain only plain objects`);
    }

    const clone: Record<string, JsonValue> = {};
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key === "symbol")) {
      throw new InvalidJsonValueError(`${path} contains a symbol key`);
    }

    for (const key of (keys as string[]).sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
        throw new InvalidJsonValueError(
          `${path}.${key} must be an enumerable data property`,
        );
      }
      Object.defineProperty(clone, key, {
        configurable: true,
        enumerable: true,
        value: cloneJsonValue(descriptor.value, ancestors, `${path}.${key}`),
        writable: true,
      });
    }
    return Object.freeze(clone);
  } finally {
    ancestors.delete(value);
  }
}

function cloneJsonObject(value: unknown): JsonObject {
  if (value === null || typeof value !== "object" || !isPlainObject(value)) {
    throw new InvalidJsonValueError("payload must be a JSON object");
  }
  return cloneJsonValue(value, new WeakSet<object>(), "payload") as JsonObject;
}

export const JsonObjectSchema = z.unknown().transform<JsonObject>((value, ctx) => {
  try {
    return cloneJsonObject(value);
  } catch (error) {
    ctx.addIssue({
      code: "custom",
      message:
        error instanceof InvalidJsonValueError
          ? error.message
          : "payload must be a lossless JSON object",
    });
    return z.NEVER;
  }
});

export const EventActorSchema = z.enum([
  "human",
  "deepseek",
  "proxy",
  "system",
]);

export const EventTypeSchema = z.enum([
  "sweep_submitted",
  "decision_parsed",
  "decision_blocked",
  "recommendation_generated",
  "alternative_requested",
  "decision_accepted",
  "decision_changed",
  "action_artifact_created",
  "preference_proposed",
  "preference_confirmed",
  "preference_rejected",
  "preference_retracted",
  "preference_contradicted",
  "preference_superseded",
  "consent_granted",
  "consent_revoked",
  "proxy_decision_generated",
  "manual_mode_enabled",
  "profile_reset",
]);

export const DomainEventSchema = z
  .object({
    id: z.string().uuid(),
    profileId: z.string().uuid(),
    aggregateId: z.string().uuid(),
    type: EventTypeSchema,
    actor: EventActorSchema,
    occurredAt: z.string().datetime(),
    payload: JsonObjectSchema,
  })
  .readonly();

export type DomainEvent = z.infer<typeof DomainEventSchema>;
