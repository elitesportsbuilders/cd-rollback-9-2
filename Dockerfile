# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application's source code from your host to your image filesystem.
COPY . .

# Build the application
RUN npm run build

# The 'vite preview' command will start a server to preview the build.
# It's not recommended for production but good for a simple setup.
# The default port for vite preview is 4173.
EXPOSE 4173

# Command to run the app
CMD ["npm", "run", "preview"]
