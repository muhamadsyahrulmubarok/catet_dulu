#!/bin/bash

# Expense Tracker Bot Deployment Script
# Usage: ./deploy.sh [development|production]

set -e

MODE=${1:-development}
echo "🚀 Deploying Expense Tracker Bot in $MODE mode..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Copying from .env.example..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before continuing."
    read -p "Press Enter to continue after editing .env file..."
fi

# Validate required environment variables
print_status "Validating environment variables..."
source .env

required_vars=("BOT_TOKEN" "GEMINI_API_KEY" "DB_PASSWORD")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "your_${var,,}_here" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Missing or default values for required variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    print_error "Please update your .env file and run the script again."
    exit 1
fi

print_success "Environment variables validated!"

if [ "$MODE" = "development" ]; then
    print_status "Setting up development environment..."
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm install
    cd web && npm install && cd ..
    
    # Run database migrations
    print_status "Running database migrations..."
    npm run migrate
    
    # Start development servers
    print_status "Starting development servers..."
    print_success "Development setup complete!"
    echo ""
    echo "🎉 Your Expense Tracker Bot is ready!"
    echo ""
    echo "📱 Bot: Running on polling mode (no webhook needed for development)"
    echo "🌐 Web Dashboard: http://localhost:3000"
    echo "🔗 API Server: http://localhost:3001"
    echo ""
    echo "To start the services, run:"
    echo "  npm run dev"
    echo ""
    
elif [ "$MODE" = "production" ]; then
    print_status "Setting up production environment..."
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        print_error "Docker is required for production deployment but not found."
        print_status "Please install Docker and Docker Compose first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is required but not found."
        print_status "Please install Docker Compose first."
        exit 1
    fi
    
    # Update nginx configuration with actual domain
    if [ ! -z "$WEBHOOK_URL" ] && [ "$WEBHOOK_URL" != "https://your-domain.com" ]; then
        DOMAIN=$(echo $WEBHOOK_URL | sed 's|https://||' | sed 's|http://||')
        print_status "Updating nginx configuration for domain: $DOMAIN"
        sed -i.bak "s/your-domain.com/$DOMAIN/g" nginx.conf
    else
        print_warning "WEBHOOK_URL not set or using default. Please update nginx.conf manually."
    fi
    
    # Create SSL directory if it doesn't exist
    if [ ! -d "ssl" ]; then
        mkdir ssl
        print_warning "SSL directory created. Please add your SSL certificates:"
        print_warning "  - ssl/cert.pem (SSL certificate)"
        print_warning "  - ssl/key.pem (Private key)"
    fi
    
    # Build and start containers
    print_status "Building and starting Docker containers..."
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Production deployment complete!"
        echo ""
        echo "🎉 Your Expense Tracker Bot is running in production!"
        echo ""
        echo "📱 Bot: Webhook mode at $WEBHOOK_URL/webhook"
        echo "🌐 Web Dashboard: $WEBHOOK_URL"
        echo "🔗 API Server: $WEBHOOK_URL/api"
        echo ""
        echo "📊 Check status:"
        echo "  docker-compose ps"
        echo "  docker-compose logs -f"
        echo ""
        
        # Set webhook if BOT_TOKEN is available
        if [ ! -z "$BOT_TOKEN" ]; then
            print_status "Setting Telegram webhook..."
            WEBHOOK_RESULT=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
                -H "Content-Type: application/json" \
                -d "{\"url\": \"$WEBHOOK_URL/webhook\"}")
            
            if echo "$WEBHOOK_RESULT" | grep -q '"ok":true'; then
                print_success "Webhook set successfully!"
            else
                print_warning "Failed to set webhook. You may need to set it manually."
                echo "Response: $WEBHOOK_RESULT"
            fi
        fi
        
    else
        print_error "Some services failed to start. Check logs with:"
        echo "  docker-compose logs"
        exit 1
    fi
    
else
    print_error "Invalid mode: $MODE"
    echo "Usage: $0 [development|production]"
    exit 1
fi

print_success "Deployment completed successfully! 🎉"