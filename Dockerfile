# Use official Node.js image as the base image
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the app files into the container
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port 3000 (default for Next.js)
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]
