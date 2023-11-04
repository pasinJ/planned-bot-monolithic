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

FROM nginx:1.25-alpine
COPY --from=build /web/dist /var/www/html
COPY ./conf.d/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]