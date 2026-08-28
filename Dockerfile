# Multi-stage build Next.js 16
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-slim AS builder
WORKDIR /app
# Heap Node bridée pour éviter l'OOM sur les machines à RAM limitée
# (Next.js 16 build peut dépasser 2 Go ; machine serveur 7.7 GiB + swap saturé).
# Overridable : docker build --build-arg NODE_OPTIONS=--max-old-space-size=4096
ARG NODE_OPTIONS="--max-old-space-size=2048"
ENV NODE_OPTIONS=$NODE_OPTIONS
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3011

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3011

CMD ["node_modules/.bin/next", "start"]
