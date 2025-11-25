FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "dev", "--host"]
