# Step 1: Build the NestJS app
FROM node:18-alpine AS builder

# Set the working directory inside the Docker container
WORKDIR /app

# Copy the package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the app's code into the container
COPY . .

# Build the app
RUN npm run build

# Step 2: Create a minimal production image
FROM node:18-alpine

# Set the working directory inside the Docker container
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose the port the app runs on
EXPOSE 4000

# Set the command to run the NestJS app
CMD ["node", "dist/main"]
