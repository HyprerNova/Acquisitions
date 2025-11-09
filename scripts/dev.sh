#!/bin/bash

# Development startup script for Acquisition App with Neon Local
# This script starts the application in development mode with Neon Local

echo "🚀 Starting Acquisition App in Development Mode"
echo "================================================"

# Check if .env.development exists
if [ ! -f .env.development ]; then
    echo "❌ Error: .env.development file not found!"
    echo "   Please copy .env.development from the template and update with your Neon credentials."
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

# Create .neon_local directory if it doesn't exist
mkdir -p .neon_local

# Add .neon_local to .gitignore if not already present
if ! grep -q ".neon_local/" .gitignore 2>/dev/null; then
    echo ".neon_local/" >> .gitignore
    echo "✅ Added .neon_local/ to .gitignore"
fi

echo "📦 Building and starting development containers..."
echo "   - Neon Local proxy will create an ephemeral database branch"
echo "   - Application will run with hot reload enabled"
echo ""

# Start development environment (this will start the database first)
echo "📦 Starting containers..."
docker compose -f docker-compose.dev.yml up -d neon-local

# Wait for the database to be ready
echo "⏳ Waiting for the database to be ready..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    # Check if container is healthy using docker inspect
    health_status=$(docker inspect --format='{{.State.Health.Status}}' neon-local 2>/dev/null)
    if [ "$health_status" = "healthy" ]; then
        echo "✅ Database is ready!"
        break
    fi
    if [ $counter -eq 0 ]; then
        echo "   Waiting for healthcheck to pass... (current status: ${health_status:-starting})"
    fi
    sleep 2
    counter=$((counter + 2))
done

# Final check
health_status=$(docker inspect --format='{{.State.Health.Status}}' neon-local 2>/dev/null)
if [ "$health_status" != "healthy" ]; then
    echo "❌ Error: Database did not become ready in time (status: ${health_status:-unknown})"
    echo "   Container status:"
    docker compose -f docker-compose.dev.yml ps neon-local
    echo "   Container logs:"
    docker compose -f docker-compose.dev.yml logs --tail 20 neon-local
    exit 1
fi

# Run migrations with Drizzle
echo "📜 Applying latest schema with Drizzle..."
npm run db:migrate

# Start the application service
echo "🚀 Starting application..."
docker compose -f docker-compose.dev.yml up --build app

echo ""
echo "🎉 Development environment started!"
echo "   Application: http://localhost:5173"
echo "   Database: postgres://neon:npg@localhost:5432/neondb"
echo ""
echo "To stop the environment, press Ctrl+C or run: docker compose down"