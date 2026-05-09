import type { MessageCreatedEvent } from '@chatapp/common';

import { logger } from '@/utils/logger';

/**
 * Phase 1: log per recipient. Outgoing **delivered** ticks are driven by:
 * - Recipient client: `POST .../receipts/notify-received` after fetching/listing messages
 * - Future: push provider delivery → `recordDeliveryAckOnChatService` per successful device
 *
 * We intentionally do **not** call chat-service on every `message.created` so “delivered”
 * always reflects an explicit ack, not a presence guess.
 */
export const notifyMessageCreatedRecipients = async (event: MessageCreatedEvent): Promise<void> => {
  const { payload } = event;

  for (const userId of payload.recipientUserIds) {
    logger.info(
      {
        notificationType: 'message.created',
        recipientUserId: userId,
        messageId: payload.messageId,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        occurredAt: event.occurredAt,
      },
      'Notify user about new conversation message (phase 1: log only; delivery ack via client or future push)',
    );
  }
};
