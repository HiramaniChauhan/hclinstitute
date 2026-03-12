# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Final Stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies for the server
COPY package*.json ./
RUN npm install --omit=dev

# Copy built frontend from build stage
COPY --from=build /app/dist ./dist

# Copy server source
COPY src/server ./src/server
COPY tsconfig.json ./

# Install tsx globally to run the server
RUN npm install -g tsx

EXPOSE 5000

# Start the server
CMD ["tsx", "src/server/index.ts"]
