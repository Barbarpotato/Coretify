# Use the official Node.js image
FROM node:20

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH
ENV PATH="/root/.bun/bin:$PATH"

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./ 

# Copy the Prisma schema directory before running bun install
COPY prisma ./prisma

# Install dependencies with Bun
RUN bun install

# Install Prisma CLI globally with Bun
RUN bun add prisma --global

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN bun prisma generate

# Expose the app port (replace with your app's port)
EXPOSE 3000

# Command to run the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]