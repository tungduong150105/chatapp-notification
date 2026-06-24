import { connect, type Channel, type ChannelModel } from 'amqplib';
import {
  CONVERSATION_EVENTS_EXCHANGE,
  NOTIFICATION_CREATED_ROUTING_KEY,
  MESSAGE_FAILED_ROUTING_KEY,
  type NotificationCreatedEvent,
  type MessageFailedEvent,
} from '@chatapp/common';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export const startPublisher = async (): Promise<void> => {
  const conn = await connect(env.RABBITMQ_URL);
  connection = conn;
  const ch = await conn.createChannel();
  channel = ch;
  await ch.assertExchange(CONVERSATION_EVENTS_EXCHANGE, 'topic', { durable: true });
  logger.info('Notification publisher ready');
};

const publish = (routingKey: string, event: object): void => {
  if (!channel) return;
  try {
    channel.publish(
      CONVERSATION_EVENTS_EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(event), 'utf-8'),
      { persistent: true, contentType: 'application/json' },
    );
  } catch (err) {
    logger.error({ err }, 'Failed to publish event');
  }
};

export const publishNotificationCreated = (event: NotificationCreatedEvent): void => {
  publish(NOTIFICATION_CREATED_ROUTING_KEY, event);
};

export const publishMessageFailed = (event: MessageFailedEvent): void => {
  publish(MESSAGE_FAILED_ROUTING_KEY, event);
};

export const stopPublisher = async (): Promise<void> => {
  try {
    if (channel) { await channel.close(); channel = null; }
    if (connection) { await connection.close(); connection = null; }
  } catch (err) {
    logger.error({ err }, 'Error stopping notification publisher');
  }
};
