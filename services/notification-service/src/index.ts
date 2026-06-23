import { createServer } from 'http';

import { createApp } from '@/app';
import { env } from '@/config/env';
import { startConsumer, stopConsumer } from '@/messaging/consumer';
import { startPublisher, stopPublisher } from '@/messaging/publisher';
import { logger } from '@/utils/logger';

const main = async () => {
  try {
    await startPublisher();
    await startConsumer();

    const app = createApp();
    const server = createServer(app);
    const port = env.NOTIFICATION_SERVICE_PORT;

    server.listen(port, () => {
      logger.info({ port }, 'Notification service HTTP is running');
    });

    const shutdown = () => {
      logger.info('Shutting down notification service...');
      void Promise.all([stopConsumer(), stopPublisher()])
        .catch((error: unknown) => {
          logger.error({ error }, 'Error during shutdown');
        })
        .finally(() => {
          server.close(() => process.exit(0));
        });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to start notification service');
    process.exit(1);
  }
};

void main();
