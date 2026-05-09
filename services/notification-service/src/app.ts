import express, { type Application } from 'express';

export const createApp = (): Application => {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'notification-service' });
  });

  return app;
};
