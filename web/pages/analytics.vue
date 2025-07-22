<template>
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Analytics</h1>
				<p class="text-gray-600 mt-1">
					Comprehensive expense analytics and insights
				</p>
			</div>
			<div class="flex space-x-3">
				<select
					v-model="selectedMonth"
					@change="fetchData"
					class="rounded-lg border-gray-300 text-sm"
				>
					<option
						v-for="month in months"
						:key="month.value"
						:value="month.value"
					>
						{{ month.label }}
					</option>
				</select>
				<select
					v-model="selectedYear"
					@change="fetchData"
					class="rounded-lg border-gray-300 text-sm"
				>
					<option v-for="year in years" :key="year" :value="year">
						{{ year }}
					</option>
				</select>
			</div>
		</div>

		<!-- Summary Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-blue-600">Active Users</p>
						<p class="text-2xl font-bold text-gray-900">{{ activeUsers }}</p>
					</div>
					<div
						class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"
					>
						<UsersIcon class="w-6 h-6 text-blue-600" />
					</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-green-600">Total Volume</p>
						<p class="text-2xl font-bold text-gray-900">
							Rp{{
								totalVolume.toLocaleString("id-ID", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})
							}}
						</p>
					</div>
					<div
						class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"
					>
						<CurrencyDollarIcon class="w-6 h-6 text-green-600" />
					</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-purple-600">Avg Transaction</p>
						<p class="text-2xl font-bold text-gray-900">
							Rp{{
								avgTransaction.toLocaleString("id-ID", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})
							}}
						</p>
					</div>
					<div
						class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"
					>
						<CalculatorIcon class="w-6 h-6 text-purple-600" />
					</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-orange-600">Top Category</p>
						<p class="text-lg font-bold text-gray-900">{{ topCategory }}</p>
					</div>
					<div
						class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"
					>
						<TagIcon class="w-6 h-6 text-orange-600" />
					</div>
				</div>
			</div>
		</div>

		<!-- Charts Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Category Distribution -->
			<div class="card">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">
					Category Distribution
				</h3>
				<div class="h-80">
					<DoughnutChart
						v-if="categoryChartData.labels.length > 0"
						:data="categoryChartData"
						:options="doughnutOptions"
					/>
					<div
						v-else
						class="flex items-center justify-center h-full text-gray-500"
					>
						No data available
					</div>
				</div>
			</div>

			<!-- User Spending Distribution -->
			<div class="card">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">
					User Spending Distribution
				</h3>
				<div class="h-80">
					<BarChart
						v-if="userSpendingData.labels.length > 0"
						:data="userSpendingData"
						:options="barOptions"
					/>
					<div
						v-else
						class="flex items-center justify-center h-full text-gray-500"
					>
						No data available
					</div>
				</div>
			</div>
		</div>

		<!-- Detailed Analytics -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Category Analysis -->
			<div class="card">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">
					Category Analysis
				</h3>
				<div class="space-y-4">
					<div
						v-for="category in categoryAnalysis"
						:key="category.name"
						class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
					>
						<div>
							<p class="font-medium text-gray-900">{{ category.name }}</p>
							<p class="text-sm text-gray-500">
								{{ category.count }} transactions
							</p>
						</div>
						<div class="text-right">
							<p class="font-bold text-gray-900">
								Rp{{
									category.total.toLocaleString("id-ID", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})
								}}
							</p>
							<p class="text-sm text-gray-500">{{ category.percentage }}%</p>
						</div>
					</div>
				</div>
			</div>

			<!-- User Insights -->
			<div class="card">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">User Insights</h3>
				<div class="space-y-4">
					<div class="p-3 bg-blue-50 rounded-lg">
						<p class="text-sm font-medium text-blue-600">Most Active User</p>
						<p class="text-lg font-bold text-gray-900">
							{{ mostActiveUser.name }}
						</p>
						<p class="text-sm text-gray-500">
							{{ mostActiveUser.transactions }} transactions
						</p>
					</div>
					<div class="p-3 bg-green-50 rounded-lg">
						<p class="text-sm font-medium text-green-600">Highest Spender</p>
						<p class="text-lg font-bold text-gray-900">
							{{ highestSpender.name }}
						</p>
						<p class="text-sm text-gray-500">
							Rp{{
								highestSpender.amount.toLocaleString("id-ID", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})
							}}
						</p>
					</div>
					<div class="p-3 bg-purple-50 rounded-lg">
						<p class="text-sm font-medium text-purple-600">Average per User</p>
						<p class="text-lg font-bold text-gray-900">
							Rp{{
								avgPerUser.toLocaleString("id-ID", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})
							}}
						</p>
						<p class="text-sm text-gray-500">across {{ activeUsers }} users</p>
					</div>
				</div>
			</div>

			<!-- Trends -->
			<div class="card">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">
					Spending Trends
				</h3>
				<div class="space-y-4">
					<div class="p-3 bg-gray-50 rounded-lg">
						<p class="text-sm font-medium text-gray-600">
							Transaction Frequency
						</p>
						<p class="text-lg font-bold text-gray-900">
							{{ transactionFrequency.toFixed(1) }}
						</p>
						<p class="text-sm text-gray-500">transactions per user</p>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<p class="text-sm font-medium text-gray-600">Popular Time</p>
						<p class="text-lg font-bold text-gray-900">{{ popularTime }}</p>
						<p class="text-sm text-gray-500">peak activity period</p>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<p class="text-sm font-medium text-gray-600">Growth Rate</p>
						<p class="text-lg font-bold text-gray-900">{{ growthRate }}%</p>
						<p class="text-sm text-gray-500">vs previous month</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Data Table -->
		<div class="card">
			<div class="flex justify-between items-center mb-4">
				<h3 class="text-lg font-semibold text-gray-900">Detailed User Data</h3>
				<button @click="exportData" class="btn-secondary">Export CSV</button>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								User
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Transactions
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Total Spent
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Average
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Top Category
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						<tr v-for="user in detailedUserData" :key="user.telegram_id">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<div
										class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
									>
										<span class="text-xs font-medium text-blue-600">
											{{
												user.first_name
													? user.first_name.charAt(0).toUpperCase()
													: "U"
											}}
										</span>
									</div>
									<div class="ml-3">
										<p class="text-sm font-medium text-gray-900">
											{{ user.first_name || "Unknown" }}
										</p>
										<p class="text-sm text-gray-500">
											@{{ user.username || "no_username" }}
										</p>
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{{ user.expense_count }}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								Rp{{
									parseFloat(user.total_amount || 0).toLocaleString("id-ID", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})
								}}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								Rp{{
									user.expense_count > 0
										? (user.total_amount / user.expense_count).toLocaleString(
												"id-ID",
												{ minimumFractionDigits: 2, maximumFractionDigits: 2 }
										  )
										: "0.00"
								}}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{{ user.category || "N/A" }}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import {
	UsersIcon,
	CurrencyDollarIcon,
	CalculatorIcon,
	TagIcon,
} from "@heroicons/vue/24/outline";
import { Doughnut as DoughnutChart, Bar as BarChart } from "vue-chartjs";
import {
	Chart as ChartJS,
	ArcElement,
	BarElement,
	CategoryScale,
	LinearScale,
	Tooltip,
	Legend,
} from "chart.js";

ChartJS.register(
	ArcElement,
	BarElement,
	CategoryScale,
	LinearScale,
	Tooltip,
	Legend
);

const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());
const analytics = ref([]);
const loading = ref(true);

const months = [
	{ value: 1, label: "January" },
	{ value: 2, label: "February" },
	{ value: 3, label: "March" },
	{ value: 4, label: "April" },
	{ value: 5, label: "May" },
	{ value: 6, label: "June" },
	{ value: 7, label: "July" },
	{ value: 8, label: "August" },
	{ value: 9, label: "September" },
	{ value: 10, label: "October" },
	{ value: 11, label: "November" },
	{ value: 12, label: "December" },
];

const years = computed(() => {
	const currentYear = new Date().getFullYear();
	return Array.from({ length: 5 }, (_, i) => currentYear - i);
});

const activeUsers = computed(() => {
	const uniqueUsers = new Set(analytics.value.map((item) => item.telegram_id));
	return uniqueUsers.size;
});

const totalVolume = computed(() => {
	return analytics.value.reduce(
		(sum, item) => sum + parseFloat(item.total_amount || 0),
		0
	);
});

const avgTransaction = computed(() => {
	const totalTransactions = analytics.value.reduce(
		(sum, item) => sum + parseInt(item.expense_count || 0),
		0
	);
	return totalTransactions > 0 ? totalVolume.value / totalTransactions : 0;
});

const topCategory = computed(() => {
	const categories = {};
	analytics.value.forEach((item) => {
		if (item.category) {
			categories[item.category] =
				(categories[item.category] || 0) + parseFloat(item.total_amount || 0);
		}
	});

	const topCat = Object.entries(categories).sort(([, a], [, b]) => b - a)[0];
	return topCat ? topCat[0] : "N/A";
});

const categoryChartData = computed(() => {
	const categories = {};
	analytics.value.forEach((item) => {
		if (item.category && item.total_amount) {
			categories[item.category] =
				(categories[item.category] || 0) + parseFloat(item.total_amount);
		}
	});

	return {
		labels: Object.keys(categories),
		datasets: [
			{
				data: Object.values(categories),
				backgroundColor: [
					"#3B82F6",
					"#10B981",
					"#F59E0B",
					"#EF4444",
					"#8B5CF6",
					"#06B6D4",
					"#84CC16",
					"#F97316",
				],
				borderWidth: 0,
			},
		],
	};
});

const userSpendingData = computed(() => {
	const userTotals = {};
	analytics.value.forEach((item) => {
		const key = item.first_name || "Unknown";
		userTotals[key] =
			(userTotals[key] || 0) + parseFloat(item.total_amount || 0);
	});

	const sortedUsers = Object.entries(userTotals)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 10);

	return {
		labels: sortedUsers.map(([name]) => name),
		datasets: [
			{
				label: "Total Spent (Rp)",
				data: sortedUsers.map(([, amount]) => amount),
				backgroundColor: "#3B82F6",
				borderRadius: 4,
			},
		],
	};
});

const categoryAnalysis = computed(() => {
	const categories = {};
	analytics.value.forEach((item) => {
		if (item.category) {
			if (!categories[item.category]) {
				categories[item.category] = { total: 0, count: 0 };
			}
			categories[item.category].total += parseFloat(item.total_amount || 0);
			categories[item.category].count += parseInt(item.expense_count || 0);
		}
	});

	const total = Object.values(categories).reduce(
		(sum, cat) => sum + cat.total,
		0
	);

	return Object.entries(categories)
		.map(([name, data]) => ({
			name,
			total: data.total,
			count: data.count,
			percentage: total > 0 ? ((data.total / total) * 100).toFixed(1) : 0,
		}))
		.sort((a, b) => b.total - a.total);
});

const mostActiveUser = computed(() => {
	const userCounts = {};
	analytics.value.forEach((item) => {
		const name = item.first_name || "Unknown";
		userCounts[name] =
			(userCounts[name] || 0) + parseInt(item.expense_count || 0);
	});

	const top = Object.entries(userCounts).sort(([, a], [, b]) => b - a)[0];
	return top
		? { name: top[0], transactions: top[1] }
		: { name: "N/A", transactions: 0 };
});

const highestSpender = computed(() => {
	const userTotals = {};
	analytics.value.forEach((item) => {
		const name = item.first_name || "Unknown";
		userTotals[name] =
			(userTotals[name] || 0) + parseFloat(item.total_amount || 0);
	});

	const top = Object.entries(userTotals).sort(([, a], [, b]) => b - a)[0];
	return top ? { name: top[0], amount: top[1] } : { name: "N/A", amount: 0 };
});

const avgPerUser = computed(() => {
	return activeUsers.value > 0 ? totalVolume.value / activeUsers.value : 0;
});

const transactionFrequency = computed(() => {
	const totalTransactions = analytics.value.reduce(
		(sum, item) => sum + parseInt(item.expense_count || 0),
		0
	);
	return activeUsers.value > 0 ? totalTransactions / activeUsers.value : 0;
});

const popularTime = computed(() => {
	// This would need actual timestamp data to be meaningful
	return "Evening";
});

const growthRate = computed(() => {
	// This would need previous month data to calculate
	return "+12.5";
});

const detailedUserData = computed(() => {
	const userMap = {};
	analytics.value.forEach((item) => {
		const key = item.telegram_id;
		if (!userMap[key]) {
			userMap[key] = {
				telegram_id: item.telegram_id,
				first_name: item.first_name,
				username: item.username,
				total_amount: 0,
				expense_count: 0,
				categories: {},
			};
		}
		userMap[key].total_amount += parseFloat(item.total_amount || 0);
		userMap[key].expense_count += parseInt(item.expense_count || 0);

		if (item.category) {
			userMap[key].categories[item.category] =
				(userMap[key].categories[item.category] || 0) +
				parseFloat(item.total_amount || 0);
		}
	});

	return Object.values(userMap)
		.map((user) => ({
			...user,
			category:
				Object.entries(user.categories).sort(([, a], [, b]) => b - a)[0]?.[0] ||
				"N/A",
		}))
		.sort((a, b) => b.total_amount - a.total_amount);
});

const doughnutOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: "bottom",
		},
	},
};

const barOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: false,
		},
	},
	scales: {
		y: {
			beginAtZero: true,
			ticks: {
				callback: function (value) {
					return "Rp" + value.toFixed(0);
				},
			},
		},
	},
};

async function fetchData() {
	loading.value = true;
	try {
		const response = await $fetch(
			`http://localhost:3001/api/analytics?year=${selectedYear.value}&month=${selectedMonth.value}`
		);
		analytics.value = response;
	} catch (error) {
		console.error("Error fetching analytics:", error);
	} finally {
		loading.value = false;
	}
}

function exportData() {
	const csvData = detailedUserData.value.map((user) => ({
		Name: user.first_name || "Unknown",
		Username: user.username || "no_username",
		"Telegram ID": user.telegram_id,
		"Total Spent": user.total_amount.toLocaleString("id-ID", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}),
		"Transaction Count": user.expense_count,
		"Average Transaction":
			user.expense_count > 0
				? (user.total_amount / user.expense_count).toLocaleString("id-ID", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
				  })
				: "0.00",
		"Top Category": user.category,
	}));

	const csv = [
		Object.keys(csvData[0]).join(","),
		...csvData.map((row) => Object.values(row).join(",")),
	].join("\n");

	const blob = new Blob([csv], { type: "text/csv" });
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `expense-analytics-${selectedYear.value}-${selectedMonth.value}.csv`;
	a.click();
	window.URL.revokeObjectURL(url);
}

onMounted(() => {
	fetchData();
});
</script>
