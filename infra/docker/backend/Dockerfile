# syntax=docker/dockerfile:1
# for using build contexts

FROM node:18-bookworm-slim as builder
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

WORKDIR /usr/strategyExecutorContextTypes
COPY --from=sect package*.json ./
RUN npm ci
COPY --from=sect ./ ./

WORKDIR /usr/api
COPY --from=api package*.json ./
RUN npm ci --ignore-scripts
COPY --from=api ./ ./
RUN npm run build
RUN npm ci --only=production

FROM node:18-bookworm-slim
ENV NODE_ENV production
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init
WORKDIR /usr/backend
COPY --from=builder --chown=node:node /usr/api/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/api/package.json ./package.json
COPY --from=builder --chown=node:node /usr/api/dist ./dist
USER node
CMD ["dumb-init", "node", "--experimental-specifier-resolution=node", "--no-warnings", "./dist/api/src/main.js"]