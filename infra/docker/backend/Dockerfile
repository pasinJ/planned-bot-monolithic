# syntax=docker/dockerfile:1
# for using build contexts

FROM node:18.17-alpine as build

COPY --from=sect . /strategyExecutorContextTypes
WORKDIR /strategyExecutorContextTypes
RUN npm ci

COPY --from=api . /api
WORKDIR /api
RUN npm ci --ignore-scripts && npm run build

FROM node:18.17-alpine
WORKDIR /app
COPY --from=build /api/package.json /api/package-lock.json /api/tsconfig.json /app/
COPY --from=build /api/dist /app/dist
RUN npm ci --omit=dev
CMD ["npm","start"]