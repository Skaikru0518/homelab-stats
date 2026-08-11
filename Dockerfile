# ---------- Build Stage ----------
FROM node:22-alpine AS builder

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy everything (node_modules and .next excluded via .dockerignore)
COPY . .

# Install dependencies and build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile && pnpm prisma generate && pnpm run build

# ---------- Production Stage ----------
FROM node:22-alpine

# Create non-root user first
RUN addgroup --system --gid 74966 nodejs && \
    adduser --system --uid 74966 nextjs

WORKDIR /app
RUN chown nextjs:nodejs /app

# Switch to non-root user before copying
USER nextjs

# Copy Next.js standalone build output with correct ownership
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start Next.js standalone server directly with node
CMD ["node", "server.js"]