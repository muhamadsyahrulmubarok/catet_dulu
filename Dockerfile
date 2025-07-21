# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY web/package*.json ./web/

# Install dependencies
RUN npm install
RUN cd web && npm install

# Copy source code
COPY . .

# Build the web application
RUN cd web && npm run build

# Expose ports
EXPOSE 3000 3001

# Create startup script
RUN echo '#!/bin/sh\n\
echo "Starting Expense Tracker Bot..."\n\
echo "Running database migrations..."\n\
npm run migrate\n\
echo "Starting services..."\n\
if [ "$NODE_ENV" = "production" ]; then\n\
  echo "Starting in production mode..."\n\
  node server/bot.js &\n\
  cd web && npm run preview\n\
else\n\
  echo "Starting in development mode..."\n\
  npm run dev\n\
fi' > /app/start.sh && chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]