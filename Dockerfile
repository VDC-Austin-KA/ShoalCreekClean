# Multi-stage build → small standalone Next.js image (Node 22: runs .ts migration script natively)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/db ./db
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/lib/pricing.ts /app/lib/content.ts ./lib/
COPY --from=build /app/data ./data
COPY --from=build /app/node_modules/bcryptjs ./node_modules/bcryptjs
USER app
EXPOSE 3000
# Apply schema (idempotent) then start. Seed once with: docker compose run --rm app node scripts/db-setup.ts --seed
CMD ["sh", "-c", "node scripts/db-setup.ts && node server.js"]
