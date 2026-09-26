FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
# Browser client (pinned + sha256-verified download, see docs/WEB-CLIENT.md).
# Build with --build-arg WITH_WEB_CLIENT=0 to skip it.
ARG WITH_WEB_CLIENT=1
RUN if [ "$WITH_WEB_CLIENT" = "1" ]; then sh scripts/fetch-web-client.sh; fi
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
