FROM node:18-alpine

# Install OpenSSL and other required libraries for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev deps for TypeScript build)
RUN npm ci

# Generate Prisma client for the correct platform
RUN npx prisma generate

# Copy source code
COPY . .

# Build the UI
WORKDIR /app/maxevo-ui
RUN npm ci
RUN npm run build

# Build the TypeScript backend
WORKDIR /app
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/server.js"]