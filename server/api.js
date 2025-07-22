const express = require("express");
const router = express.Router();
const { db, pool } = require("./database");

// GET /api/users
router.get("/users", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT telegram_id, first_name, username, created_at FROM users ORDER BY created_at DESC"
		);
		res.json(result.rows);
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /api/analytics
router.get("/analytics", async (req, res) => {
	try {
		const { year, month } = req.query;
		const currentDate = new Date();
		const analyticsYear = year || currentDate.getFullYear();
		const analyticsMonth = month || currentDate.getMonth() + 1;
		const allUsersExpenses = await db.getAllUsersExpenses(
			analyticsYear,
			analyticsMonth
		);
		res.json(allUsersExpenses);
	} catch (error) {
		console.error("Error fetching analytics:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /api/report/:telegramId
router.get("/report/:telegramId", async (req, res) => {
	try {
		const { telegramId } = req.params;
		const { year, month } = req.query;
		const currentDate = new Date();
		const reportYear = year || currentDate.getFullYear();
		const reportMonth = month || currentDate.getMonth() + 1;
		const expenses = await db.getExpensesByMonth(
			telegramId,
			reportYear,
			reportMonth
		);
		const monthlyReport = await db.getMonthlyReport(
			telegramId,
			reportYear,
			reportMonth
		);
		const total = await db.getTotalExpenses(
			telegramId,
			reportYear,
			reportMonth
		);
		res.json({
			expenses,
			monthlyReport,
			total: parseFloat(total),
			year: reportYear,
			month: reportMonth,
		});
	} catch (error) {
		console.error("Error generating report:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;
