const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

const { db } = require('./database');
const geminiService = require('./gemini');

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Storage for uploaded files
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize database
db.initTables();

// Bot commands and handlers
bot.start(async (ctx) => {
  const user = ctx.from;
  await db.createUser(user.id, user.username, user.first_name);
  
  const welcomeMessage = `
🎉 Selamat datang di Expense Tracker Bot! / Welcome to Expense Tracker Bot!

Saya dapat membantu Anda melacak pengeluaran bulanan dengan beberapa cara:
I can help you track your monthly expenses in several ways:

📝 *Input Teks / Text Input:* 
• Bahasa Indonesia: "Kopi 15rb", "Makan siang 25000", "Ojek 10k"
• English: "Coffee $5", "Bus ticket 2.50"

📸 *Input Gambar / Image Input:* 
Kirim foto struk, bon, atau label harga dan saya akan mengekstrak informasi pengeluaran secara otomatis
Send photos of receipts, bills, or price tags and I'll extract expense information automatically

📊 *Laporan / Reports:* Dapatkan laporan bulanan yang detail dan analitik
Get detailed monthly reports and analytics

*Perintah yang Tersedia / Available Commands:*
/help - Tampilkan pesan bantuan / Show help message
/report - Laporan bulan ini / Current month's report  
/expenses - Lihat pengeluaran terbaru / View recent expenses
/categories - Lihat kategori / View categories
/total - Total bulanan / Monthly total

Mulai kirim pengeluaran Anda! / Just start sending me your expenses! 💰
  `;
  
  ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
});

bot.help((ctx) => {
  const helpMessage = `
🤖 *Bantuan Expense Tracker Bot / Bot Help*

*Cara menambah pengeluaran / How to add expenses:*

1️⃣ *Format Teks / Text Format:*
   🇮🇩 Bahasa Indonesia:
   • "Kopi 15rb" atau "Kopi 15000"
   • "Makan siang di KFC 35k"
   • "Ojek 12000", "Bensin 50rb"
   • "Belanja baju 150k"
   
   🇺🇸 English:
   • "Coffee 5" or "Coffee $5"
   • "Lunch at McDonald's 12.50"
   • "Bus ticket 2"

2️⃣ *Upload Gambar / Image Upload:*
   • Kirim foto struk belanja / Send photos of receipts
   • Foto label harga / Photos of price tags
   • Screenshot struk digital / Screenshots of digital receipts

*Perintah / Commands:*
/report - Laporan pengeluaran bulanan / Monthly expense report
/expenses - Lihat pengeluaran terbaru (10 terakhir) / View recent expenses (last 10)
/total - Total bulan ini / Current month total
/categories - Kategori yang tersedia / Available categories

*Tips:*
• Saya otomatis mendeteksi kategori dari pengeluaran Anda
  I automatically detect categories from your expenses
• Gambar diproses menggunakan AI untuk ekstraksi yang akurat
  Images are processed using AI for accurate extraction
• Semua data disimpan dengan aman
  All data is stored securely
• Anda dapat mengedit pengeluaran melalui dashboard web
  You can edit expenses through the web dashboard

Butuh bantuan lebih? Tanya saja! / Need more help? Just ask! 😊
  `;
  
  ctx.reply(helpMessage, { parse_mode: 'Markdown' });
});

// Handle text messages (expense input)
bot.on('text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return; // Skip commands
  
  try {
    const text = ctx.message.text;
    const userId = ctx.from.id;
    
    // Show processing message
    const processingMsg = await ctx.reply('🔄 Processing your expense...');
    
    // Process text with Gemini
    const processedData = await geminiService.processText(text);
    
    // If no amount detected, ask for clarification
    if (!processedData.amount || processedData.amount <= 0) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        '❌ Tidak dapat mendeteksi jumlah dalam pesan Anda. Mohon sertakan harga.\n\n' +
        'Contoh / Example:\n' +
        '🇮🇩 "Kopi 15rb", "Makan siang 25000"\n' +
        '🇺🇸 "Coffee $5", "Lunch 12.50"'
      );
      return;
    }
    
    // Create expense in database
    const expense = await db.createExpense(
      userId,
      parseFloat(processedData.amount),
      processedData.description || text,
      processedData.category || 'Other',
      processedData.date || new Date().toISOString().split('T')[0],
      null, // no image URL for text
      text,
      JSON.stringify(processedData)
    );
    
    // Create confirmation message with inline keyboard
    const confirmationMessage = `
✅ *Pengeluaran Berhasil Ditambahkan! / Expense Added Successfully!*

💰 Jumlah / Amount: Rp ${parseFloat(processedData.amount).toLocaleString('id-ID')}
📝 Deskripsi / Description: ${processedData.description || text}
🏷️ Kategori / Category: ${processedData.category || 'Other'}
📅 Tanggal / Date: ${processedData.date || new Date().toLocaleDateString()}
    `;
    
          const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📊 Lihat Laporan / View Report', 'report')],
        [Markup.button.callback('📋 Pengeluaran Terbaru / Recent Expenses', 'expenses')],
        [Markup.button.callback('💯 Total Bulanan / Monthly Total', 'total')]
      ]);
    
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      null,
      confirmationMessage,
      { parse_mode: 'Markdown', reply_markup: keyboard.reply_markup }
    );
    
  } catch (error) {
    console.error('Error processing text expense:', error);
    ctx.reply('❌ Sorry, there was an error processing your expense. Please try again.');
  }
});

// Handle photo messages (receipt OCR)
bot.on('photo', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Get highest resolution
    
    // Show processing message
    const processingMsg = await ctx.reply('📸 Processing your receipt image...');
    
    // Download image
    const fileInfo = await ctx.telegram.getFile(photo.file_id);
    const imageUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    
    // Process image with Sharp (convert to JPEG if needed)
    const imageBuffer = await sharp(response.data)
      .jpeg()
      .toBuffer();
    
    // Process with Gemini
    const processedData = await geminiService.processImage(imageBuffer, 'image/jpeg');
    
    // If no amount detected, still save the raw text
    if (!processedData.amount || processedData.amount <= 0) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        `📸 Image processed but no clear expense amount found.\n\n📝 Extracted text: ${processedData.raw_text || 'No text detected'}\n\nPlease send the amount manually like "Amount: $XX.XX"`
      );
      return;
    }
    
    // Create expense in database
    const expense = await db.createExpense(
      userId,
      parseFloat(processedData.amount),
      processedData.description || 'Expense from image',
      processedData.category || 'Other',
      processedData.date || new Date().toISOString().split('T')[0],
      imageUrl,
      processedData.raw_text,
      JSON.stringify(processedData)
    );
    
    // Create confirmation message
    const confirmationMessage = `
✅ *Pengeluaran Berhasil Diekstrak dari Gambar! / Expense Extracted from Image!*

💰 Jumlah / Amount: Rp ${parseFloat(processedData.amount).toLocaleString('id-ID')}
📝 Deskripsi / Description: ${processedData.description || 'Expense from image'}
🏷️ Kategori / Category: ${processedData.category || 'Other'}
🏪 Merchant: ${processedData.merchant || 'Tidak terdeteksi / Not detected'}
📅 Tanggal / Date: ${processedData.date || new Date().toLocaleDateString()}

📋 Teks mentah / Raw text: ${processedData.raw_text ? processedData.raw_text.substring(0, 100) + '...' : 'None'}
    `;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📊 Lihat Laporan / View Report', 'report')],
      [Markup.button.callback('📋 Pengeluaran Terbaru / Recent Expenses', 'expenses')]
    ]);
    
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      null,
      confirmationMessage,
      { parse_mode: 'Markdown', reply_markup: keyboard.reply_markup }
    );
    
  } catch (error) {
    console.error('Error processing image expense:', error);
    ctx.reply('❌ Sorry, there was an error processing your image. Please try again or send the expense as text.');
  }
});

// Command handlers
bot.command('report', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const expenses = await db.getExpensesByMonth(userId, year, month);
    const monthlyReport = await db.getMonthlyReport(userId, year, month);
    const total = await db.getTotalExpenses(userId, year, month);
    
    if (expenses.length === 0) {
      ctx.reply('📊 Belum ada pengeluaran tercatat untuk bulan ini. Mulai tambahkan pengeluaran!\n\n📊 No expenses recorded for this month yet. Start adding some expenses!');
      return;
    }
    
    let reportMessage = `📊 *Laporan Bulanan / Monthly Report - ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*\n\n`;
    reportMessage += `💰 *Total Pengeluaran / Total Spent:* Rp ${parseFloat(total).toLocaleString('id-ID')}\n`;
    reportMessage += `📝 *Total Transaksi / Total Transactions:* ${expenses.length}\n\n`;
    reportMessage += `*Rincian per Kategori / Breakdown by Category:*\n`;
    
    monthlyReport.forEach(category => {
      const percentage = ((category.total / total) * 100).toFixed(1);
      reportMessage += `• ${category.category}: Rp ${parseFloat(category.total).toLocaleString('id-ID')} (${percentage}%)\n`;
    });
    
    // Generate AI insights
    try {
      const insights = await geminiService.generateMonthlyReport(expenses);
      reportMessage += `\n🤖 *Wawasan AI / AI Insights:*\n${insights.substring(0, 500)}...`;
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📋 View All Expenses', 'expenses')],
      [Markup.button.url('🌐 Web Dashboard', `${process.env.WEBHOOK_URL}/dashboard`)]
    ]);
    
    ctx.reply(reportMessage, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    ctx.reply('❌ Error generating report. Please try again.');
  }
});

bot.command('expenses', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const expenses = await db.getExpenses(userId, 10);
    
    if (expenses.length === 0) {
      ctx.reply('📋 No expenses recorded yet. Start adding some!');
      return;
    }
    
    let message = '📋 *Recent Expenses:*\n\n';
    expenses.forEach((expense, index) => {
      const date = new Date(expense.date).toLocaleDateString();
      message += `${index + 1}. $${parseFloat(expense.amount).toFixed(2)} - ${expense.description}\n`;
      message += `   📅 ${date} | 🏷️ ${expense.category}\n\n`;
    });
    
    ctx.reply(message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error fetching expenses:', error);
    ctx.reply('❌ Error fetching expenses. Please try again.');
  }
});

bot.command('total', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const total = await db.getTotalExpenses(userId, year, month);
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });
    
    ctx.reply(`💰 *Total for ${monthName} ${year}:* $${parseFloat(total).toFixed(2)}`, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error fetching total:', error);
    ctx.reply('❌ Error fetching total. Please try again.');
  }
});

bot.command('categories', async (ctx) => {
  try {
    const categories = await db.getCategories();
    let message = '🏷️ *Available Categories:*\n\n';
    categories.forEach(cat => {
      message += `• ${cat.name}\n`;
    });
    message += '\nCategories are automatically detected, but you can specify them in your expense text.';
    
    ctx.reply(message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    ctx.reply('❌ Error fetching categories. Please try again.');
  }
});

// Inline button handlers
bot.action('report', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.deleteMessage();
  await bot.handleUpdate({ message: { text: '/report', from: ctx.from, chat: ctx.chat } });
});

bot.action('expenses', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.deleteMessage();
  await bot.handleUpdate({ message: { text: '/expenses', from: ctx.from, chat: ctx.chat } });
});

bot.action('total', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.deleteMessage();
  await bot.handleUpdate({ message: { text: '/total', from: ctx.from, chat: ctx.chat } });
});

// Web API endpoints for the Nuxt.js app
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.pool.query('SELECT telegram_id, first_name, username, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/expenses/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { year, month } = req.query;
    
    let expenses;
    if (year && month) {
      expenses = await db.getExpensesByMonth(telegramId, year, month);
    } else {
      expenses = await db.getExpenses(telegramId, 100);
    }
    
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/report/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { year, month } = req.query;
    
    const currentDate = new Date();
    const reportYear = year || currentDate.getFullYear();
    const reportMonth = month || (currentDate.getMonth() + 1);
    
    const expenses = await db.getExpensesByMonth(telegramId, reportYear, reportMonth);
    const monthlyReport = await db.getMonthlyReport(telegramId, reportYear, reportMonth);
    const total = await db.getTotalExpenses(telegramId, reportYear, reportMonth);
    
    res.json({
      expenses,
      monthlyReport,
      total: parseFloat(total),
      year: reportYear,
      month: reportMonth
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentDate = new Date();
    const analyticsYear = year || currentDate.getFullYear();
    const analyticsMonth = month || (currentDate.getMonth() + 1);
    
    const allUsersExpenses = await db.getAllUsersExpenses(analyticsYear, analyticsMonth);
    res.json(allUsersExpenses);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for Telegram
app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Monthly report cron job (runs on the 1st of each month at 9 AM)
cron.schedule('0 9 1 * *', async () => {
  console.log('Running monthly report cron job...');
  
  try {
    const users = await db.pool.query('SELECT telegram_id FROM users');
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;
    
    for (const user of users.rows) {
      try {
        const expenses = await db.getExpensesByMonth(user.telegram_id, year, month);
        if (expenses.length > 0) {
          const total = await db.getTotalExpenses(user.telegram_id, year, month);
          const monthName = lastMonth.toLocaleDateString('en-US', { month: 'long' });
          
          const message = `📊 *Monthly Report - ${monthName} ${year}*\n\n💰 Total Spent: $${parseFloat(total).toFixed(2)}\n📝 Transactions: ${expenses.length}\n\nUse /report for detailed breakdown!`;
          
          await bot.telegram.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
        }
      } catch (error) {
        console.error(`Error sending report to user ${user.telegram_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in monthly report cron job:', error);
  }
});

// Start the server
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === 'production') {
  // Set webhook for production
  bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/webhook`);
  console.log('Webhook set for production');
} else {
  // Use polling for development
  bot.launch();
  console.log('Bot started with polling for development');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));