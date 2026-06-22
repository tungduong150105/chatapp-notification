import { MESSAGE_CREATED_ROUTING_KEY } from '@chatapp/common';
import { describe, expect, it, vi } from 'vitest';

import { notifyMessageCreatedRecipients } from '@/notify/handler';

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('notifyMessageCreatedRecipients', () => {
  it('logs once per recipient', async () => {
    const { logger } = await import('@/utils/logger');

    await notifyMessageCreatedRecipients({
      type: MESSAGE_CREATED_ROUTING_KEY,
      occurredAt: '2026-01-01T00:00:00.000Z',
      payload: {
        messageId: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'sender',
        bodyPreview: 'hello',
        recipientUserIds: ['user-a', 'user-b'],
      },
    });

    expect(logger.info).toHaveBeenCalledTimes(2);
  });

  it('does not log when there are no recipients', async () => {
    const { logger } = await import('@/utils/logger');
    vi.mocked(logger.info).mockClear();

    await notifyMessageCreatedRecipients({
      type: MESSAGE_CREATED_ROUTING_KEY,
      occurredAt: '2026-01-01T00:00:00.000Z',
      payload: {
        messageId: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'sender',
        bodyPreview: 'hello',
        recipientUserIds: [],
      },
    });

    expect(logger.info).not.toHaveBeenCalled();
  });
});
