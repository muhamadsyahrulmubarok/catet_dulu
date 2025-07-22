<template>
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Users</h1>
				<p class="text-gray-600 mt-1">Manage and view user expense details</p>
			</div>
			<div class="flex space-x-3">
				<input
					v-model="searchQuery"
					type="text"
					placeholder="Search users..."
					class="rounded-lg border-gray-300 text-sm"
				/>
			</div>
		</div>

		<!-- Users Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<div
				v-for="user in filteredUsers"
				:key="user.telegram_id"
				class="card cursor-pointer hover:shadow-md transition-shadow"
				@click="selectUser(user)"
			>
				<div class="flex items-center space-x-4">
					<div
						class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"
					>
						<span class="text-lg font-medium text-blue-600">
							{{
								user.first_name ? user.first_name.charAt(0).toUpperCase() : "U"
							}}
						</span>
					</div>
					<div class="flex-1">
						<h3 class="font-semibold text-gray-900">
							{{ user.first_name || "Unknown User" }}
						</h3>
						<p class="text-sm text-gray-500">
							@{{ user.username || "no_username" }}
						</p>
						<p class="text-xs text-gray-400">ID: {{ user.telegram_id }}</p>
					</div>
				</div>
				<div class="mt-4 pt-4 border-t border-gray-200">
					<div class="flex justify-between text-sm">
						<span class="text-gray-500">Joined:</span>
						<span class="text-gray-900">{{
							new Date(user.created_at).toLocaleDateString()
						}}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- User Details Modal -->
		<div
			v-if="selectedUser"
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		>
			<div
				class="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
			>
				<div class="flex justify-between items-center mb-6">
					<div class="flex items-center space-x-4">
						<div
							class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center"
						>
							<span class="text-2xl font-medium text-blue-600">
								{{
									selectedUser.first_name
										? selectedUser.first_name.charAt(0).toUpperCase()
										: "U"
								}}
							</span>
						</div>
						<div>
							<h2 class="text-2xl font-bold text-gray-900">
								{{ selectedUser.first_name || "Unknown User" }}
							</h2>
							<p class="text-gray-500">
								@{{ selectedUser.username || "no_username" }}
							</p>
							<p class="text-sm text-gray-400">
								Telegram ID: {{ selectedUser.telegram_id }}
							</p>
						</div>
					</div>
					<button
						@click="selectedUser = null"
						class="text-gray-400 hover:text-gray-600"
					>
						<XMarkIcon class="w-6 h-6" />
					</button>
				</div>

				<!-- Month/Year Selector -->
				<div class="flex space-x-3 mb-6">
					<select
						v-model="selectedMonth"
						@change="fetchUserExpenses"
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
						@change="fetchUserExpenses"
						class="rounded-lg border-gray-300 text-sm"
					>
						<option v-for="year in years" :key="year" :value="year">
							{{ year }}
						</option>
					</select>
				</div>

				<!-- User Stats -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div class="stat-card">
						<p class="text-sm font-medium text-blue-600">Total Spent</p>
						<p class="text-2xl font-bold text-gray-900">
							Rp{{
								userReport.total.toLocaleString("id-ID", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})
							}}
						</p>
					</div>
					<div class="stat-card">
						<p class="text-sm font-medium text-green-600">Transactions</p>
						<p class="text-2xl font-bold text-gray-900">
							{{ userReport.expenses.length }}
						</p>
					</div>
					<div class="stat-card">
						<p class="text-sm font-medium text-purple-600">Average</p>
						<p class="text-2xl font-bold text-gray-900">
							Rp{{
								userReport.expenses.length > 0
									? (
											userReport.total / userReport.expenses.length
									  ).toLocaleString("id-ID", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
									  })
									: "0,00"
							}}
						</p>
					</div>
				</div>

				<!-- Category Breakdown -->
				<div class="mb-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">
						Category Breakdown
					</h3>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
						<div
							v-for="category in userReport.monthlyReport"
							:key="category.category"
							class="bg-gray-50 rounded-lg p-3"
						>
							<p class="text-sm font-medium text-gray-900">
								{{ category.category }}
							</p>
							<p class="text-lg font-bold text-blue-600">
								Rp{{
									parseFloat(category.total).toLocaleString("id-ID", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})
								}}
							</p>
							<p class="text-xs text-gray-500">
								{{ category.count }} transactions
							</p>
						</div>
					</div>
				</div>

				<!-- Expenses List -->
				<div>
					<h3 class="text-lg font-semibold text-gray-900 mb-4">
						Recent Expenses
					</h3>
					<div class="space-y-3 max-h-64 overflow-y-auto">
						<div
							v-for="expense in userReport.expenses"
							:key="expense.id"
							class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
						>
							<div class="flex-1">
								<p class="font-medium text-gray-900">
									{{ expense.description }}
								</p>
								<p class="text-sm text-gray-500">
									{{ expense.category }} •
									{{ new Date(expense.date).toLocaleDateString() }}
								</p>
								<p v-if="expense.raw_text" class="text-xs text-gray-400 mt-1">
									{{ expense.raw_text.substring(0, 50) }}...
								</p>
							</div>
							<div class="text-right">
								<p class="font-bold text-gray-900">
									Rp{{
										parseFloat(expense.amount).toLocaleString("id-ID", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})
									}}
								</p>
								<p class="text-xs text-gray-500">
									{{ new Date(expense.created_at).toLocaleTimeString() }}
								</p>
							</div>
						</div>
						<div
							v-if="userReport.expenses.length === 0"
							class="text-center text-gray-500 py-8"
						>
							No expenses found for this period
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Loading State -->
		<div v-if="loading" class="flex justify-center items-center py-12">
			<div
				class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
			></div>
		</div>

		<!-- Empty State -->
		<div v-if="!loading && users.length === 0" class="text-center py-12">
			<UsersIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
			<h3 class="text-lg font-medium text-gray-900 mb-2">No users found</h3>
			<p class="text-gray-500">
				Users will appear here once they start using the bot.
			</p>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { UsersIcon, XMarkIcon } from "@heroicons/vue/24/outline";

const users = ref([]);
const selectedUser = ref(null);
const userReport = ref({ expenses: [], monthlyReport: [], total: 0 });
const searchQuery = ref("");
const loading = ref(true);

const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());

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

const filteredUsers = computed(() => {
	if (!searchQuery.value) return users.value;

	const query = searchQuery.value.toLowerCase();
	return users.value.filter(
		(user) =>
			(user.first_name && user.first_name.toLowerCase().includes(query)) ||
			(user.username && user.username.toLowerCase().includes(query)) ||
			user.telegram_id.toString().includes(query)
	);
});

async function fetchUsers() {
	loading.value = true;
	try {
		const response = await $fetch("http://localhost:3001/api/users");
		users.value = response;
	} catch (error) {
		console.error("Error fetching users:", error);
	} finally {
		loading.value = false;
	}
}

async function selectUser(user) {
	selectedUser.value = user;
	await fetchUserExpenses();
}

async function fetchUserExpenses() {
	if (!selectedUser.value) return;

	try {
		const response = await $fetch(
			`http://localhost:3001/api/report/${selectedUser.value.telegram_id}?year=${selectedYear.value}&month=${selectedMonth.value}`
		);
		userReport.value = response;
	} catch (error) {
		console.error("Error fetching user expenses:", error);
	}
}

onMounted(() => {
	fetchUsers();
});
</script>
