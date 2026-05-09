import {
  CONVERSATION_EVENTS_EXCHANGE,
  MESSAGE_CREATED_ROUTING_KEY,
  messageCreatedEventSchema,
} from '@chatapp/common';

import { env } from '@/config/env';
import { notifyMessageCreatedRecipients } from '@/notify/handler';
import { logger } from '@/utils/logger';

import {
  connect,
  type Channel,
  type ChannelModel,
  type ConsumeMessage,
  type Replies,
} from 'amqplib';

const EVENT_QUEUE = 'notification-service.message-events';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;
let consumerTag: string | null = null;

export const startConsumer = async (): Promise<void> => {
  const conn = await connect(env.RABBITMQ_URL);
  connection = conn;
  const ch = await conn.createChannel();
  channel = ch;

  await ch.assertExchange(CONVERSATION_EVENTS_EXCHANGE, 'topic', { durable: true });
  const queue = await ch.assertQueue(EVENT_QUEUE, { durable: true });
  await ch.bindQueue(queue.queue, CONVERSATION_EVENTS_EXCHANGE, MESSAGE_CREATED_ROUTING_KEY);

  const consumeHandler = (message: ConsumeMessage | null) => {
    if (!message) {
      return;
    }

    void (async () => {
      const raw = message.content.toString('utf-8');
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw) as unknown;
      } catch {
        logger.error({ raw }, 'Invalid JSON for message.created');
        ch.nack(message, false, false);
        return;
      }

      const parsedEvent = messageCreatedEventSchema.safeParse(parsed);
      if (!parsedEvent.success) {
        logger.error(
          { issues: parsedEvent.error.format(), raw },
          'Invalid message.created event shape',
        );
        ch.nack(message, false, false);
        return;
      }

      try {
        await notifyMessageCreatedRecipients(parsedEvent.data);
        ch.ack(message);
      } catch (error: unknown) {
        logger.error({ err: error }, 'Failed to handle message.created');
        ch.nack(message, false, false);
      }
    })();
  };

  const result: Replies.Consume = await ch.consume(queue.queue, consumeHandler);
  consumerTag = result.consumerTag;
  logger.info('RabbitMQ notification consumer started');
};

export const stopConsumer = async (): Promise<void> => {
  try {
    const ch = channel;
    if (ch && consumerTag) {
      await ch.cancel(consumerTag);
      consumerTag = null;
    }
    if (ch) {
      await ch.close();
      channel = null;
    }
    const conn = connection;
    if (conn) {
      await conn.close();
      connection = null;
    }
  } catch (error: unknown) {
    logger.error({ err: error }, 'Error stopping RabbitMQ consumer');
  }
};
