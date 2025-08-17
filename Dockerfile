FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Clean up dev dependencies after build
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/server.js"]