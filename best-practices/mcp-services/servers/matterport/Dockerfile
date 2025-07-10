# Matterport MCP Server Dockerfile
FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache tini

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci --only=production

# Copy server files
COPY matterport-mcp-server.js ./

# Create non-root user
RUN addgroup -g 1001 -S mcp && \
    adduser -S mcp -u 1001 -G mcp

# Switch to non-root user
USER mcp

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Start the server
CMD ["node", "matterport-mcp-server.js"]