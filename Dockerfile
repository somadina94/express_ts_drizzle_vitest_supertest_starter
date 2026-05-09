# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

ARG DATABASE_URL
ARG NODE_ENV
ARG PORT
ARG JWT_SECRET
ARG JWT_EXPIRES_IN
ARG JWT_COOKIE_EXPIRES_IN

ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
ENV JWT_SECRET=${JWT_SECRET}
ENV JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
ENV JWT_COOKIE_EXPIRES_IN=${JWT_COOKIE_EXPIRES_IN}

# Copy package files and Drizzle config
COPY package*.json tsconfig*.json drizzle.config.ts ./

# Install all dependencies including devDependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY src ./src

# Compile TypeScript
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine

WORKDIR /app

# Copy built app and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --only=production --legacy-peer-deps

# Expose port
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Create logs directory
RUN mkdir -p /app/logs

# Start the server (set DATABASE_URL at runtime)
CMD ["node", "dist/server.js"]
