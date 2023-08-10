# syntax=docker/dockerfile:1

ARG NODE_VERSION=18.17-alpine

FROM node:${NODE_VERSION} as build
WORKDIR /app
COPY --from=src . /app
RUN npm ci --ignore-scripts
RUN npm run build

FROM node:${NODE_VERSION}
WORKDIR /app
COPY --from=src package.json package-lock.json tsconfig.json /app/
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist /app/dist
CMD ["npm","start"]