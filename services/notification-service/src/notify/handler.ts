import type { MessageCreatedEvent } from '@chatapp/common';
import { NOTIFICATION_CREATED_ROUTING_KEY } from '@chatapp/common';
import { logger } from '@/utils/logger';
import { publishNotificationCreated, publishMessageFailed } from '@/messaging/publisher';
import { MESSAGE_FAILED_ROUTING_KEY } from '@chatapp/common';

export const notifyMessageCreatedRecipients = async (event: MessageCreatedEvent): Promise<void> => {
  const { payload } = event;
  const sagaId = payload.sagaId ?? payload.messageId;

  try {
    for (const userId of payload.recipientUserIds) {
      logger.info(
        {
          notificationType: 'message.created',
          recipientUserId: userId,
          messageId: payload.messageId,
          conversationId: payload.conversationId,
          senderId: payload.senderId,
          sagaId,
          occurredAt: event.occurredAt,
        },
        'Notifying user about new message',
      );
      // TODO: integrate push provider (FCM/APNs) here
    }

    // Saga step complete — emit notification.created
    publishNotificationCreated({
      type: NOTIFICATION_CREATED_ROUTING_KEY,
      occurredAt: new Date().toISOString(),
      payload: {
        sagaId,
        messageId: payload.messageId,
        conversationId: payload.conversationId,
        recipientUserIds: payload.recipientUserIds,
      },
    });
  } catch (err) {
    logger.error({ err, sagaId }, 'Notification step failed — emitting message.failed');
    publishMessageFailed({
      type: MESSAGE_FAILED_ROUTING_KEY,
      occurredAt: new Date().toISOString(),
      payload: {
        sagaId,
        messageId: payload.messageId,
        conversationId: payload.conversationId,
        failedStep: 'notification',
        reason: err instanceof Error ? err.message : 'Unknown error',
      },
    });
  }
};
