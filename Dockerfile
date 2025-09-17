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

# Expose the port your app listens on
EXPOSE 8080

# Define the command to run your app
CMD ["npm", "run", "dev"]
