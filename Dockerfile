# Use Node.js LTS version
FROM node:24.11-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
