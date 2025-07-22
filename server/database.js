const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	database: process.env.DB_NAME,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
});

// Test database connection
pool.connect((err, client, release) => {
	if (err) {
		console.error("Error acquiring client", err.stack);
	} else {
		console.log("Database connected successfully");
		release();
	}
});

// Database helper functions
const db = {
	// Create tables if they don't exist
	async initTables() {
		const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

		const createExpensesTable = `
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        telegram_id BIGINT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        image_url TEXT,
        raw_text TEXT,
        processed_text TEXT
      );
    `;

		const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

		// Insert default categories
		const insertDefaultCategories = `
      INSERT INTO categories (name) VALUES 
        ('Food'), ('Transport'), ('Entertainment'), ('Shopping'), 
        ('Bills'), ('Health'), ('Education'), ('Other')
      ON CONFLICT (name) DO NOTHING;
    `;

		try {
			await pool.query(createUsersTable);
			await pool.query(createExpensesTable);
			await pool.query(createCategoriesTable);
			await pool.query(insertDefaultCategories);
			console.log("Database tables initialized successfully");
		} catch (err) {
			console.error("Error initializing tables:", err);
		}
	},

	// User operations
	async createUser(telegramId, username, firstName) {
		const query = `
      INSERT INTO users (telegram_id, username, first_name) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (telegram_id) DO UPDATE SET 
        username = $2, first_name = $3
      RETURNING *;
    `;
		const result = await pool.query(query, [telegramId, username, firstName]);
		return result.rows[0];
	},

	async getUser(telegramId) {
		const query = "SELECT * FROM users WHERE telegram_id = $1";
		const result = await pool.query(query, [telegramId]);
		return result.rows[0];
	},

	// Expense operations
	async createExpense(
		telegramId,
		amount,
		description,
		category,
		date,
		imageUrl,
		rawText,
		processedText
	) {
		const query = `
      INSERT INTO expenses (telegram_id, amount, description, category, date, image_url, raw_text, processed_text)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
		const result = await pool.query(query, [
			telegramId,
			amount,
			description,
			category,
			date,
			imageUrl,
			rawText,
			processedText,
		]);
		return result.rows[0];
	},

	async getExpenses(telegramId, limit = 50, offset = 0) {
		const query = `
      SELECT * FROM expenses 
      WHERE telegram_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3;
    `;
		const result = await pool.query(query, [telegramId, limit, offset]);
		return result.rows;
	},

	async getExpensesByMonth(telegramId, year, month) {
		const query = `
      SELECT * FROM expenses 
      WHERE telegram_id = $1 
        AND EXTRACT(YEAR FROM date) = $2 
        AND EXTRACT(MONTH FROM date) = $3
      ORDER BY date DESC;
    `;
		const result = await pool.query(query, [telegramId, year, month]);
		return result.rows;
	},

	async getMonthlyReport(telegramId, year, month) {
		const query = `
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average
      FROM expenses 
      WHERE telegram_id = $1 
        AND EXTRACT(YEAR FROM date) = $2 
        AND EXTRACT(MONTH FROM date) = $3
      GROUP BY category
      ORDER BY total DESC;
    `;
		const result = await pool.query(query, [telegramId, year, month]);
		return result.rows;
	},

	async getTotalExpenses(telegramId, year, month) {
		const query = `
      SELECT SUM(amount) as total
      FROM expenses 
      WHERE telegram_id = $1 
        AND EXTRACT(YEAR FROM date) = $2 
        AND EXTRACT(MONTH FROM date) = $3;
    `;
		const result = await pool.query(query, [telegramId, year, month]);
		return result.rows[0]?.total || 0;
	},

	// Category operations
	async getCategories() {
		const query = "SELECT * FROM categories ORDER BY name";
		const result = await pool.query(query);
		return result.rows;
	},

	// Analytics for web dashboard
	async getAllUsersExpenses(year, month) {
		const query = `
      SELECT 
        u.telegram_id,
        u.first_name,
        u.username,
        COUNT(e.id) as expense_count,
        SUM(e.amount) as total_amount,
        e.category
      FROM users u
      LEFT JOIN expenses e ON u.telegram_id = e.telegram_id
      WHERE EXTRACT(YEAR FROM e.date) = $1 AND EXTRACT(MONTH FROM e.date) = $2
      GROUP BY u.telegram_id, u.first_name, u.username, e.category
      ORDER BY total_amount DESC;
    `;
		const result = await pool.query(query, [year, month]);
		return result.rows;
	},

	async getExpensesByDateRange(telegramId, startDate, endDate) {
		const query = `
      SELECT * FROM expenses 
      WHERE telegram_id = $1 
        AND date BETWEEN $2 AND $3
      ORDER BY date DESC;
    `;
		const result = await pool.query(query, [telegramId, startDate, endDate]);
		return result.rows;
	},
};

module.exports = { pool, db };
