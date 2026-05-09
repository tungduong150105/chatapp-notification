/**
 * Call when a push provider confirms delivery to a **specific** recipient device
 * (FCM/APNs delivery receipt, etc.). Uses internal auth — keep token secret.
 *
 * Phase 1 (log-only consumer): unused. Recipient ticks advance via client `notify-received`.
 */
export async function recordDeliveryAckOnChatService(config: {
  baseUrl: string;
  internalToken: string;
  conversationId: string;
  messageId: string;
  recipientUserId: string;
}): Promise<void> {
  const base = config.baseUrl.replace(/\/$/, '');
  const res = await fetch(
    `${base}/internal/conversations/${config.conversationId}/receipts/delivery-ack`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': config.internalToken,
      },
      body: JSON.stringify({
        messageId: config.messageId,
        recipientUserId: config.recipientUserId,
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`chat-service POST receipts/delivery-ack failed: ${res.status} ${text}`);
  }
}
