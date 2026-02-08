# Adjust BUN_VERSION as desired
ARG BUN_VERSION=1.3.8 # latest
FROM oven/bun:${BUN_VERSION} as base

WORKDIR /app

# Install dependencies (production only for final image, but we need devDependencies for build)
FROM base as deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the app
FROM base as build
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
# Generate Prisma Client
RUN bun x prisma generate
RUN bun run build

# Production image
FROM base
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public
COPY --from=build /app/package.json /app/package.json

# If using prisma in production, we need the schema too for some commands, but mostly the client is enough.
# Copying schema for potential runtime usage if needed by tools.
COPY --from=build /app/prisma /app/prisma

ENV NODE_ENV=production

CMD ["bun", "run", "start"]