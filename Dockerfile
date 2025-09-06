# Use an official Node.js runtime as a parent image
FROM node:22-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Build your application (if it's a TypeScript/frontend project)
RUN npm run build

# Expose the port your app listens on (must match the --port in cloudbuild.yaml)
EXPOSE 8080

# Define the command to run your app
CMD ["npm", "start"]
