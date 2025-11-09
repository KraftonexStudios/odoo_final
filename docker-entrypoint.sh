#!/bin/sh
set -e

echo "Starting application..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until pg_isready -h postgres -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-client_rewire}; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing migrations"

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma Client (if needed)
npx prisma generate

echo "Starting Next.js application..."

# Start the application
exec "$@"

