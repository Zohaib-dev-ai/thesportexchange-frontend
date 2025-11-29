# Frontend Dockerfile for The Sport Exchange
FROM node:20-alpine AS builder

WORKDIR /app

# Set build-time environment variable
ARG NEXT_PUBLIC_API_URL=http://localhost:5001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files
COPY package*.json ./

# Install dependencies with increased network timeout
RUN npm ci --prefer-offline --no-audit

# Copy all source files
COPY . .

# Build Next.js app with optimizations
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files
COPY package*.json ./

# Install only production dependencies (including typescript for next.config.ts)
RUN npm ci --only=production --prefer-offline --no-audit && npm install typescript --no-save

# Copy built files and public assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Set runtime environment variable
ARG NEXT_PUBLIC_API_URL=http://localhost:5001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]
