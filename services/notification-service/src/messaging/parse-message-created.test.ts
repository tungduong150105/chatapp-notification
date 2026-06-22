import { MESSAGE_CREATED_ROUTING_KEY } from '@chatapp/common';
import { describe, expect, it } from 'vitest';

import { parseMessageCreatedEvent } from '@/messaging/parse-message-created';

describe('parseMessageCreatedEvent', () => {
  const validEvent = {
    type: MESSAGE_CREATED_ROUTING_KEY,
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      messageId: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'sender',
      bodyPreview: 'hello',
      recipientUserIds: ['user-a'],
    },
  };

  it('parses valid JSON events', () => {
    const result = parseMessageCreatedEvent(JSON.stringify(validEvent));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.payload.messageId).toBe('msg-1');
    }
  });

  it('rejects invalid JSON', () => {
    const result = parseMessageCreatedEvent('{not json');
    expect(result).toEqual({ ok: false, reason: 'invalid_json' });
  });

  it('rejects invalid event shape', () => {
    const result = parseMessageCreatedEvent(JSON.stringify({ type: 'other' }));
    expect(result).toEqual({ ok: false, reason: 'invalid_shape' });
  });
});
