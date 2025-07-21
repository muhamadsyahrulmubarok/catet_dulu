# Expense Tracker Bot 💰

A comprehensive expense tracking system with a Telegram bot, AI-powered OCR using Gemini 2.5 Flash, and a beautiful Nuxt.js dashboard.

## Features

### 🤖 Telegram Bot
- **Bilingual Support**: English and Indonesian language input
- **Text Input**: Send expenses like "Coffee $5", "Kopi 15rb", or "Makan siang 25k"
- **Image OCR**: Upload receipt photos for automatic expense extraction
- **AI Processing**: Gemini 2.5 Flash analyzes text and images in both languages
- **Smart Categorization**: Automatic expense categorization with Indonesian keywords
- **Monthly Reports**: Detailed spending analytics with bilingual interface
- **Interactive Commands**: Easy-to-use bot interface in both languages

### 📊 Web Dashboard
- **Real-time Analytics**: Comprehensive expense insights
- **User Management**: View and manage all bot users
- **Visual Charts**: Category distribution and spending trends
- **Export Data**: CSV export functionality
- **Responsive Design**: Beautiful, modern UI

### 🔧 Technical Features
- **PostgreSQL Database**: Robust data storage
- **RESTful API**: Backend API for web dashboard
- **Webhook Support**: Production-ready Telegram integration
- **Docker Support**: Easy deployment with containers
- **SSL/HTTPS**: Secure communication
- **Automated Backups**: Database backup scripts

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Telegram Bot Token
- Gemini API Key

### 1. Clone and Setup
```bash
git clone <repository-url>
cd expense-tracker-bot
cp .env.example .env
```

### 2. Configure Environment Variables
Edit `.env` file:
```env
# Telegram Bot Token (get from @BotFather)
BOT_TOKEN=your_telegram_bot_token_here

# Your domain for webhooks (production)
WEBHOOK_URL=https://your-domain.com

# Gemini API Key (get from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration
DB_HOST=localhost
DB_PORT=30703
DB_NAME=expense_tracker
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Install Dependencies
```bash
npm run setup
```

### 4. Setup Database
```bash
npm run migrate
```

### 5. Start Development
```bash
npm run dev
```

This will start:
- Telegram bot on port 3001
- Nuxt.js dashboard on port 3000

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Prepare Environment**
```bash
cp .env.example .env
# Edit .env with your production values
```

2. **Deploy with Docker**
```bash
docker-compose up -d
```

This will deploy:
- Application container
- PostgreSQL database
- Nginx reverse proxy
- SSL termination

### Option 2: Manual Deployment

1. **Server Setup**
```bash
# Install Node.js, PostgreSQL, Nginx
npm run setup
npm run migrate
```

2. **Start Services**
```bash
# Production mode
NODE_ENV=production npm start

# Or use PM2 for process management
pm2 start server/bot.js --name expense-bot
pm2 start "cd web && npm run preview" --name expense-web
```

3. **Configure Nginx**
```nginx
# Copy nginx.conf and update domain name
# Setup SSL certificates
```

### Option 3: Cloud Deployment

#### Heroku
```bash
# Install Heroku CLI
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set BOT_TOKEN=your_token
heroku config:set GEMINI_API_KEY=your_key
heroku config:set WEBHOOK_URL=https://your-app.herokuapp.com

# Deploy
git push heroku main
```

#### DigitalOcean App Platform
```yaml
# app.yaml
name: expense-tracker
services:
- name: web
  source_dir: /
  github:
    repo: your-username/expense-tracker-bot
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: BOT_TOKEN
    value: your_token
  - key: GEMINI_API_KEY
    value: your_key
databases:
- name: postgres
  engine: PG
  version: "15"
```

#### Railway
```bash
# Install Railway CLI
railway login
railway init
railway add postgresql

# Set environment variables in Railway dashboard
# Deploy
railway up
```

## Indonesian Language Support

The bot fully supports Indonesian language input with intelligent processing:

### Supported Features
- **Number Formats**: "15rb", "25k", "2.5k", "Rp 15.000", "50ribu"
- **Food Terms**: makan, minum, kopi, nasi, ayam, soto, bakso, warteg, padang
- **Transport**: ojek, gojek, grab, busway, kereta, bensin, parkir, tol
- **Shopping**: beli, belanja, baju, sepatu, mall, toko, minimarket
- **Bills**: listrik, air, internet, pulsa, token, tagihan, pembayaran
- **Entertainment**: nonton, bioskop, karaoke, gym, spa, wisata, hotel

### Example Usage
```
User: "Kopi 15rb di Starbucks"
Bot: ✅ Expense Added! Coffee - Rp 15,000 (Food category)

User: "Ojek grab 12k"
Bot: ✅ Expense Added! Grab ride - Rp 12,000 (Transport category)

User: "Belanja baju 150ribu"
Bot: ✅ Expense Added! Shopping clothes - Rp 150,000 (Shopping category)
```

### AI Processing
- Gemini 2.5 Flash understands Indonesian context and slang
- Automatic translation of descriptions to English for consistency
- Smart categorization based on Indonesian keywords
- OCR processing of Indonesian receipts and bills

## Configuration

### Telegram Bot Setup

1. **Create Bot**
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Get your bot token

2. **Set Webhook (Production)**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/webhook"}'
```

### Gemini API Setup

1. **Get API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create new API key
   - Add to environment variables

### Database Configuration

For existing PostgreSQL server on port 30703:
```env
DB_HOST=your_postgres_host
DB_PORT=30703
DB_NAME=expense_tracker
DB_USER=your_username
DB_PASSWORD=your_password
```

## Usage

### Bot Commands
- `/start` - Initialize bot and get welcome message
- `/help` - Show help and usage instructions
- `/report` - Get current month's expense report
- `/expenses` - View recent expenses
- `/total` - Get monthly total
- `/categories` - View available categories

### Adding Expenses

**Text Format (English):**
- "Coffee 5"
- "Lunch at McDonald's 12.50"
- "Bus ticket $2"
- "Groceries 45.30 food"

**Format Teks (Bahasa Indonesia):**
- "Kopi 15rb" atau "Kopi 15000"
- "Makan siang di KFC 35k"
- "Ojek 12000", "Bensin 50rb"
- "Belanja baju 150k"
- "Listrik 200ribu"
- "Parkir 5000"

**Supported Indonesian Number Formats:**
- "15rb" = 15,000
- "25k" = 25,000
- "2.5k" = 2,500
- "Rp 15.000" = 15,000
- "50ribu" = 50,000

**Image Upload:**
- Send photos of receipts (English/Indonesian)
- Upload price tags
- Share digital receipt screenshots
- Indonesian receipts are automatically processed

### Web Dashboard

Access at `http://localhost:3000` (development) or your domain (production):

- **Dashboard**: Overview statistics and charts
- **Users**: Manage users and view individual reports
- **Analytics**: Comprehensive spending analytics

## API Endpoints

### Public Endpoints
- `POST /webhook` - Telegram webhook
- `GET /health` - Health check

### Dashboard API
- `GET /api/users` - Get all users
- `GET /api/expenses/:telegramId` - Get user expenses
- `GET /api/report/:telegramId` - Get user report
- `GET /api/analytics` - Get analytics data

## Monitoring and Maintenance

### Logs
```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f postgres

# View nginx logs
docker-compose logs -f nginx
```

### Database Backup
```bash
# Backup
pg_dump -h localhost -p 30703 -U postgres expense_tracker > backup.sql

# Restore
psql -h localhost -p 30703 -U postgres expense_tracker < backup.sql
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check BOT_TOKEN is correct
   - Verify webhook URL is accessible
   - Check server logs

2. **Image processing fails**
   - Verify GEMINI_API_KEY is valid
   - Check API quota limits
   - Ensure image format is supported

3. **Database connection errors**
   - Verify database credentials
   - Check database is running
   - Confirm port accessibility

4. **Web dashboard not loading**
   - Check if Nuxt.js is running
   - Verify API endpoints are accessible
   - Check browser console for errors

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check specific component
DEBUG=bot:* npm run bot
DEBUG=web:* npm run web
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: your-email@example.com
- 💬 Telegram: @your_username
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/expense-tracker-bot/issues)

---

**Made with ❤️ for better expense tracking**
