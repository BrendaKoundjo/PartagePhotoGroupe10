FROM node:18-alpine

WORKDIR /app

# Install Angular CLI globally
RUN npm install -g @angular/cli@18

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port and start application
EXPOSE 4200
CMD ["ng", "serve", "--host", "0.0.0.0", "--disable-host-check"]