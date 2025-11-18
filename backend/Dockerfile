# Use Bun's official image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Development dependencies (for building if needed)
FROM base AS install-dev
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
FROM base AS build
COPY --from=install-dev /app/node_modules ./node_modules
COPY . .

# Production image
FROM base AS release

# Copy application files
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./

# Expose port
EXPOSE 3000

# Health check using wget (available in bun base image)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["bun", "run", "src/index.ts"]
