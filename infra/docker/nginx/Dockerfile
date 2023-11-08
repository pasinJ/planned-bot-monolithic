# syntax=docker/dockerfile:1
# for using build contexts

FROM node:18-bookworm-slim as builder

WORKDIR /usr/strategyExecutorContextTypes
COPY --from=sect package*.json ./
RUN npm ci
COPY --from=sect ./ ./
RUN npm run genType

WORKDIR /usr/web
COPY --from=web package*.json ./
RUN npm ci
COPY --from=web ./ ./
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.25-bookworm
COPY --from=builder /usr/web/dist /var/www/html
COPY ./conf.d/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]