import 'dotenv/config';

import { createEnv, z } from '@chatapp/common';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NOTIFICATION_SERVICE_PORT: z.coerce.number().int().min(0).max(65_535).default(4010),
  RABBITMQ_URL: z.string().min(1),
  /** Reserved for push delivery callbacks to chat-service (see `recordDeliveryAckOnChatService`). */
  CHAT_SERVICE_URL: z.string().default(''),
  /** Same value as chat-service `INTERNAL_API_TOKEN` when using delivery-ack. */
  INTERNAL_API_TOKEN: z.string().default(''),
});

type EnvType = z.infer<typeof envSchema>;

export const env: EnvType = createEnv(envSchema, {
  serviceName: 'notification-service',
});

export type Env = typeof env;
