# Use the official Node.js image as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install && \
    npm install bcrypt
   

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE ${SERVER_PORT}

# Define the command to run the app
CMD ["node", "mpc_node_mailer_server.js"]



