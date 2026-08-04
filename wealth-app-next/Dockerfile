# ─────────────────────────────────────────────────────────────────
# Wealth Analyzer — container image.
#
# Exists because the deployment target is a Swiss EAM's Avaloq
# environment, not a PaaS. A partner application that can only run on a
# US-headquartered platform fails the first question their IT asks, and
# it makes the residency promise in legal/PRIVACY-EN.md undeliverable.
#
# Two things about Next.js that shape this file:
#
#  1. NEXT_PUBLIC_* IS BAKED IN AT BUILD TIME. It is inlined into the
#     browser bundle, so passing it only at `docker run` produces an image
#     that renders perfectly, can never authenticate, and emails
#     confirmation links pointing at localhost. They are build args here,
#     and lib/env.ts refuses to start if they are still placeholders.
#  2. Server-only secrets (FEEDS_ENCRYPTION_KEY, ORDERS_HOST_ALLOWLIST)
#     must NOT be build args — a build arg is readable in the image
#     history forever. They arrive at runtime.
# ─────────────────────────────────────────────────────────────────

# ─── deps ────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# `npm ci` needs the lockfile; fall back only if one genuinely is not there.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ─── build ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Inlined into the client bundle. Wrong values here cannot be fixed later
# by the runtime environment.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── run ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Never root. An EAM's container scan flags it, and correctly.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# `output: "standalone"` emits a server plus only the modules it reaches.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# Distinguishes "running" from "able to serve": /api/health returns 503
# when the database is unreachable or configuration is fatally wrong, so an
# orchestrator restarts rather than routing traffic into a broken instance.
# `degraded` deliberately stays 200 — pulling every replica because an
# allowlist is unset would turn a warning into an outage.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
