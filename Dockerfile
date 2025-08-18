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

# Copy UI build files to ensure they're preserved after pruning
RUN cp -r maxevo-ui/dist /tmp/ui-dist

# Remove dev dependencies to reduce image size (only from main package)
RUN npm prune --production

# Restore UI build files
RUN mkdir -p maxevo-ui && cp -r /tmp/ui-dist maxevo-ui/dist && rm -rf /tmp/ui-dist

EXPOSE 3000

CMD ["node", "dist/server.js"]