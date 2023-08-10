# syntax=docker/dockerfile:1

ARG NODE_VERSION=18.17-alpine
ARG NGINX_VERSION=1.25-alpine

FROM node:${NODE_VERSION} as build
WORKDIR /app
COPY --from=src . /app
RUN npm ci
RUN npm run build
RUN apk add --update --no-cache openssl
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
COPY ./conf.d /app/conf.d
RUN sed -i "s/<<DOMAIN_NAME>>/${DOMAIN_NAME}/g" /app/conf.d/default.conf

FROM nginx:${NGINX_VERSION}
COPY --from=build /app/dist /var/www/html
COPY --from=build /tmp/nginx-selfsigned.key /etc/nginx/ssl/nginx-selfsigned.key
COPY --from=build /tmp/nginx-selfsigned.crt /etc/nginx/ssl/nginx-selfsigned.crt
COPY --from=build /tmp/dhparam.pem /etc/nginx/ssl/dhparam.pem
COPY --from=build /app/conf.d/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80