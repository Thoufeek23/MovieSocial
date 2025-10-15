### Multi-stage Dockerfile for MovieSocial (server + client)
FROM node:20-alpine AS build
WORKDIR /app

# copy root files and install server deps
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --production=false

# build client
WORKDIR /app
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci --production=false
COPY client/ ./client/
RUN npm run build

# final image
FROM node:20-alpine AS runtime
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --production=true
COPY server/ ./server/

# copy built client into server for static serving
COPY --from=build /app/client/build /app/client/build

WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 5001
CMD ["node", "index.js"]
