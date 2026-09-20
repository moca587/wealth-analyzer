# Development image for the SaaS app (wealth-app-next/).
#
# Dependencies are installed into the image; the source is bind-mounted by
# docker-compose.yaml so edits on the host hot-reload inside the container.
# node_modules and .next live in named volumes so the host's copies (different
# OS / arch) never shadow the container's. docker-entrypoint.dev.sh re-runs
# `npm ci` when the bind-mounted lockfile drifts from the volume stamp.
#
# Node major matches the production image (wealth-app-next/Dockerfile, Node 20).
# Debian slim (not alpine) so native addons like `pg` build cleanly in dev.
# The production image is wealth-app-next/Dockerfile — this one is dev only.

FROM node:20-bookworm-slim AS dev

ENV NEXT_TELEMETRY_DISABLED=1 \
    WATCHPACK_POLLING=true

WORKDIR /app

COPY --chown=node:node docker-entrypoint.dev.sh /usr/local/bin/docker-entrypoint.dev.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.dev.sh \
    && mkdir -p /app/.next \
    && chown node:node /app /app/.next

# Lockfile first so the dependency layer is cached until deps change.
COPY --chown=node:node wealth-app-next/package.json wealth-app-next/package-lock.json ./

USER node
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci \
    && sha256sum package-lock.json | awk '{print $1}' > node_modules/.package-lock.sha

ENTRYPOINT ["docker-entrypoint.dev.sh"]
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
