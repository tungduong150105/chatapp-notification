import { messageCreatedEventSchema } from '@chatapp/common';

export type ParseMessageCreatedResult =
  | { ok: true; event: ReturnType<typeof messageCreatedEventSchema.parse> }
  | { ok: false; reason: 'invalid_json' | 'invalid_shape' };

export function parseMessageCreatedEvent(raw: string): ParseMessageCreatedResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }

  const result = messageCreatedEventSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, reason: 'invalid_shape' };
  }

  return { ok: true, event: result.data };
}
