# Use an official Node.js runtime as a parent image
# Check Docker Hub for the exact tag for 22.12.0 if it exists,
# otherwise, '22' or '22-slim' is more common for the latest patch of Node 22.
FROM node:22.12.0-slim # Or node:22, node:22-alpine, etc. depending on your needs

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Build your application (if it's a TypeScript/frontend project)
# Example for a frontend build
# RUN npm run build

# Expose the port your app listens on (must match the --port in cloudbuild.yaml)
EXPOSE 4173

# Define the command to run your app
CMD ["npm", "start"]

