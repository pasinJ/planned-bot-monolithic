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

WORKDIR /usr/nginx
RUN apt-get update && \
    apt-get install -y openssl
ARG DOMAIN_NAME=localhost
ARG DAYS_VALID=30
RUN echo "Creating self-signed certificate valid for ${DAYS_VALID} days for domain ${DOMAIN_NAME}" && \
    openssl req -x509 -nodes \
    -newkey rsa:2048 \
    -days ${DAYS_VALID} \
    -subj "/CN=${DOMAIN_NAME}" \
    -addext "subjectAltName=DNS:${DOMAIN_NAME}" \
    -keyout /tmp/nginx-selfsigned.key \
    -out /tmp/nginx-selfsigned.crt
RUN openssl dhparam -out /tmp/dhparam.pem 4096
COPY ./conf.d/https.default.conf ./conf.d/default.conf
RUN sed -i "s/<<DOMAIN_NAME>>/${DOMAIN_NAME}/g" ./conf.d/default.conf


FROM nginx:1.25-bookworm
COPY --from=builder /usr/web/dist /var/www/html
COPY --from=builder /tmp/nginx-selfsigned.key /etc/nginx/ssl/nginx-selfsigned.key
COPY --from=builder /tmp/nginx-selfsigned.crt /etc/nginx/ssl/nginx-selfsigned.crt
COPY --from=builder /tmp/dhparam.pem /etc/nginx/ssl/dhparam.pem
COPY --from=builder /usr/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]