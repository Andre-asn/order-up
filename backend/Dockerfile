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

# Install bash, curl, and the Datadog Agent
USER root
RUN apt-get update && apt-get install -y bash curl procps && \
    DD_INSTALL_ONLY=true DD_API_KEY=placeholder bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script_agent7.sh)" && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy application files
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Start Datadog Agent in the background\n\
if [ -n "$DD_API_KEY" ]; then\n\
  echo "Starting Datadog Agent..."\n\
  DD_SITE=${DD_SITE:-"us5.datadoghq.com"} \\\n\
  DD_HOSTNAME=$(hostname) \\\n\
  DD_LOGS_ENABLED=true \\\n\
  DD_APM_ENABLED=true \\\n\
  DD_APM_NON_LOCAL_TRAFFIC=true \\\n\
  /opt/datadog-agent/bin/agent/agent run > /tmp/datadog.log 2>&1 &\n\
  \n\
  echo "Waiting for Datadog Agent to start..."\n\
  sleep 5\n\
fi\n\
\n\
# Start the application\n\
exec bun run src/index.ts\n\
' > /app/start.sh && chmod +x /app/start.sh

# Change ownership to bun user
RUN chown -R bun:bun /app

# Expose port
EXPOSE 3000

# Health check using wget (available in bun base image)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start with the script
CMD ["/app/start.sh"]
