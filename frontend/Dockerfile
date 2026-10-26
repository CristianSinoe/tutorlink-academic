FROM node:20-alpine AS development

WORKDIR /app

COPY package.json package-lock.json ./
RUN CYPRESS_INSTALL_BINARY=0 npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]

FROM development AS build
# Public configuration is injected at runtime; never pass private keys to Vite.
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS production
USER root
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/15-tutorlink-config.sh /docker-entrypoint.d/15-tutorlink-config.sh
RUN chmod 755 /docker-entrypoint.d/15-tutorlink-config.sh \
    && chown -R 101:101 /etc/nginx/conf.d /etc/nginx/templates /usr/share/nginx/html
USER 101
ENV PORT=8080
EXPOSE 8080
