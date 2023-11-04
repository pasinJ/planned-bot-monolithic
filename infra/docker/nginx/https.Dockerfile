# syntax=docker/dockerfile:1
# for using build contexts

FROM node:18.17-alpine as build

COPY --from=sect . /strategyExecutorContextTypes
WORKDIR /strategyExecutorContextTypes
RUN npm ci && npm run genType

COPY --from=web . /web
WORKDIR /web
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm ci && npm run build

WORKDIR /nginx
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
COPY ./conf.d/https.default.conf /nginx/conf.d/default.conf
RUN sed -i "s/<<DOMAIN_NAME>>/${DOMAIN_NAME}/g" /nginx/conf.d/default.conf


# ARG NGINX_VERSION=1.25-alpine
FROM nginx:1.25-alpine
COPY --from=build /web/dist /var/www/html
COPY --from=build /tmp/nginx-selfsigned.key /etc/nginx/ssl/nginx-selfsigned.key
COPY --from=build /tmp/nginx-selfsigned.crt /etc/nginx/ssl/nginx-selfsigned.crt
COPY --from=build /tmp/dhparam.pem /etc/nginx/ssl/dhparam.pem
COPY --from=build /nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]