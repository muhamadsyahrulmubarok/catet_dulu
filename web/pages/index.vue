<template>
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
				<p class="text-gray-600 mt-1">Overview of expense tracking activity</p>
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

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-blue-600">Total Users</p>
						<p class="text-2xl font-bold text-gray-900">
							{{ stats.totalUsers }}
						</p>
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
						<p class="text-sm font-medium text-green-600">Total Expenses</p>
						<p class="text-2xl font-bold text-gray-900">
							Rp{{
								stats.totalAmount.toLocaleString("id-ID", {
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
						<p class="text-sm font-medium text-purple-600">Transactions</p>
						<p class="text-2xl font-bold text-gray-900">
							{{ stats.totalTransactions }}
						</p>
					</div>
					<div
						class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"
					>
						<DocumentTextIcon class="w-6 h-6 text-purple-600" />
					</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-orange-600">Avg per User</p>
						<p class="text-2xl font-bold text-gray-900">
							Rp{{
								stats.avgPerUser.toLocaleString("id-ID", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})
							}}
						</p>
					</div>
					<div
						class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"
					>
						<ChartBarIcon class="w-6 h-6 text-orange-600" />
					</div>
				</div>
			</div>
		</div>

		<!-- Charts -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Category Distribution -->
			<div class="card">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">
					Expenses by Category
				</h3>
				<div class="h-64">
					<DoughnutChart
						v-if="categoryData.labels.length > 0"
						:data="categoryData"
						:options="chartOptions"
					/>
					<div
						v-else
						class="flex items-center justify-center h-full text-gray-500"
					>
						No data available
					</div>
				</div>
			</div>

			<!-- Top Spenders -->
			<div class="card">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Top Spenders</h3>
				<div class="space-y-3">
					<div
						v-for="user in topSpenders"
						:key="user.telegram_id"
						class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
					>
						<div class="flex items-center space-x-3">
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
							<div>
								<p class="font-medium text-gray-900">
									{{ user.first_name || "Unknown" }}
								</p>
								<p class="text-sm text-gray-500">
									@{{ user.username || "no_username" }}
								</p>
							</div>
						</div>
						<div class="text-right">
							<p class="font-semibold text-gray-900">
								Rp{{
									parseFloat(user.total_amount || 0).toLocaleString("id-ID", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})
								}}
							</p>
							<p class="text-xs text-gray-500">
								{{ user.expense_count }} transactions
							</p>
						</div>
					</div>
					<div
						v-if="topSpenders.length === 0"
						class="text-center text-gray-500 py-8"
					>
						No spending data available
					</div>
				</div>
			</div>
		</div>

		<!-- Recent Activity -->
		<div class="card">
			<div class="flex justify-between items-center mb-4">
				<h3 class="text-lg font-semibold text-gray-900">Recent Users</h3>
				<NuxtLink
					to="/users"
					class="text-blue-600 hover:text-blue-700 text-sm font-medium"
				>
					View all →
				</NuxtLink>
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
								Joined
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Telegram ID
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						<tr v-for="user in recentUsers" :key="user.telegram_id">
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
								{{ new Date(user.created_at).toLocaleDateString() }}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{{ user.telegram_id }}
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
	DocumentTextIcon,
	ChartBarIcon,
} from "@heroicons/vue/24/outline";
import { Doughnut as DoughnutChart } from "vue-chartjs";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const config = useRuntimeConfig();

const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());

const users = ref([]);
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

const stats = computed(() => {
	const totalUsers = users.value.length;
	const totalAmount = analytics.value.reduce(
		(sum, item) => sum + parseFloat(item.total_amount || 0),
		0
	);
	const totalTransactions = analytics.value.reduce(
		(sum, item) => sum + parseInt(item.expense_count || 0),
		0
	);
	const avgPerUser = totalUsers > 0 ? totalAmount / totalUsers : 0;

	return {
		totalUsers,
		totalAmount,
		totalTransactions,
		avgPerUser,
	};
});

const categoryData = computed(() => {
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

const topSpenders = computed(() => {
	const userTotals = {};
	analytics.value.forEach((item) => {
		const key = item.telegram_id;
		if (!userTotals[key]) {
			userTotals[key] = {
				telegram_id: item.telegram_id,
				first_name: item.first_name,
				username: item.username,
				total_amount: 0,
				expense_count: 0,
			};
		}
		userTotals[key].total_amount += parseFloat(item.total_amount || 0);
		userTotals[key].expense_count += parseInt(item.expense_count || 0);
	});

	return Object.values(userTotals)
		.sort((a, b) => b.total_amount - a.total_amount)
		.slice(0, 5);
});

const recentUsers = computed(() => {
	return users.value.slice(0, 5);
});

const chartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: "bottom",
		},
	},
};

async function fetchData() {
	loading.value = true;
	try {
		const [usersResponse, analyticsResponse] = await Promise.all([
			$fetch("http://localhost:3001/api/users"),
			$fetch(
				`http://localhost:3001/api/analytics?year=${selectedYear.value}&month=${selectedMonth.value}`
			),
		]);

		users.value = usersResponse;
		analytics.value = analyticsResponse;
	} catch (error) {
		console.error("Error fetching data:", error);
	} finally {
		loading.value = false;
	}
}

onMounted(() => {
	fetchData();
});
</script>
