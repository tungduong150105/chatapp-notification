# syntax=docker/dockerfile:1
# Build context must be the parent directory of chatapp-notification (e.g. micro/) so both
# chatapp-notification and chatapp-conversation are available.

FROM node:22-alpine AS base
WORKDIR /workspace

FROM base AS deps

COPY chatapp-notification/package.json chatapp-notification/package-lock.json ./chatapp-notification/
COPY chatapp-notification/services/notification-service/package.json ./chatapp-notification/services/notification-service/
COPY chatapp-conversation/packages/common/package.json ./chatapp-conversation/packages/common/

# npm file: dependency resolves to chatapp-notification/chatapp-conversation/… (symlink in local dev)
RUN ln -sf /workspace/chatapp-conversation /workspace/chatapp-notification/chatapp-conversation

WORKDIR /workspace/chatapp-notification
RUN npm ci

FROM deps AS builder

WORKDIR /workspace

COPY chatapp-conversation/tsconfig.base.json ./chatapp-conversation/tsconfig.base.json
COPY chatapp-conversation/packages/common ./chatapp-conversation/packages/common

COPY chatapp-notification/tsconfig.base.json ./chatapp-notification/tsconfig.base.json
COPY chatapp-notification/tsconfig.json ./chatapp-notification/tsconfig.json
COPY chatapp-notification/services/notification-service ./chatapp-notification/services/notification-service

RUN ln -sf /workspace/chatapp-conversation /workspace/chatapp-notification/chatapp-conversation

WORKDIR /workspace/chatapp-conversation/packages/common
RUN npm install && npm run build

WORKDIR /workspace/chatapp-notification
RUN npm run build --workspace=services/notification-service

FROM node:22-alpine AS production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

WORKDIR /workspace/chatapp-notification

COPY chatapp-notification/package.json chatapp-notification/package-lock.json ./
COPY chatapp-notification/services/notification-service/package.json ./services/notification-service/
COPY chatapp-conversation/packages/common/package.json /workspace/chatapp-conversation/packages/common/package.json

RUN ln -sf /workspace/chatapp-conversation /workspace/chatapp-notification/chatapp-conversation

RUN npm ci --omit=dev

COPY --from=builder /workspace/chatapp-conversation/packages/common/dist /workspace/chatapp-conversation/packages/common/dist
COPY --from=builder /workspace/chatapp-notification/services/notification-service/dist ./services/notification-service/dist

# @chatapp/common is loaded from this path; Node resolves imports from that directory tree,
# so deps must exist under packages/common/node_modules (not only the workspace root).
WORKDIR /workspace/chatapp-conversation/packages/common
RUN npm install --omit=dev

WORKDIR /workspace/chatapp-notification

RUN chown -R nodeuser:nodejs /workspace/chatapp-notification /workspace/chatapp-conversation

USER nodeuser

ENV NODE_ENV=production
ENV NOTIFICATION_SERVICE_PORT=4010

EXPOSE 4010

WORKDIR /workspace/chatapp-notification/services/notification-service

CMD ["node", "dist/index.js"]
