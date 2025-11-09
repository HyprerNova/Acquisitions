# Multi-stage Dockerfile for Node.js application
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development

# Install all dependencies including dev dependencies
RUN npm ci && npm cache clean --force

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Use node watch for development
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]

