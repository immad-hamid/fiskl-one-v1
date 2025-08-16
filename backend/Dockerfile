# backend/Dockerfile
FROM node:22-alpine

WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm install
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["npm", "run", "start:prod"]