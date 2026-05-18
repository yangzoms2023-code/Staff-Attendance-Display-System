"use client";

import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	Users,
	UserCheck,
	UserX,
	CalendarX,
	TrendingUp,
	Clock,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Legend,
} from "recharts";
import { fetchEmployees, type Employee } from "@/lib/services/employeeApi";
import { fetchDepartments } from "@/lib/services/departmentApi";
import {
	fetchDailySummary,
	type DailySummary,
} from "@/lib/services/attendanceApi";
import {
	fetchWeeklyHolidays,
	fetchDateHolidays,
} from "@/lib/services/holidayApi";

const formatDate = (date: Date) => date.toISOString().split("T")[0];

export default function DashboardPage() {
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [departments, setDepartments] = useState<
		{ id: string; name: string }[]
	>([]);
	const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);
	const [weeklyData, setWeeklyData] = useState<
		{
			day: string;
			present: number;
			absent: number;
			leave: number;
			isHoliday: boolean;
		}[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showAllStaff, setShowAllStaff] = useState(false);

	const today = formatDate(new Date());

	// Get Monday of the current week and return 7 days with day names (without date)
	const getCurrentWeekDays = () => {
		const now = new Date();
		const currentDay = now.getDay();
		const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
		const monday = new Date(now);
		monday.setDate(now.getDate() + diffToMonday);
		monday.setHours(0, 0, 0, 0);

		const weekDays = [];
		for (let i = 0; i < 7; i++) {
			const date = new Date(monday);
			date.setDate(monday.getDate() + i);
			const dayName = date.toLocaleDateString("en-US", {
				weekday: "short",
			});
			const dayOfWeek = i + 1; // Monday=1, Sunday=7
			weekDays.push({ date, dayName, dayOfWeek });
		}
		return weekDays;
	};

	useEffect(() => {
		const loadDashboard = async () => {
			try {
				setLoading(true);
				setError(null);

				// Load employees and departments
				const [empsResult, deptsResult] = await Promise.allSettled([
					fetchEmployees(),
					fetchDepartments(),
				]);

				let emps: Employee[] = [];
				let depts: { id: string; name: string }[] = [];

				if (empsResult.status === "fulfilled") {
					emps = empsResult.value;
				} else {
					console.error(
						"Failed to load employees:",
						empsResult.reason,
					);
					setError("Failed to load employees");
				}

				if (deptsResult.status === "fulfilled") {
					depts = deptsResult.value.map((d) => ({
						id: d.id,
						name: d.name,
					}));
				} else {
					console.error(
						"Failed to load departments:",
						deptsResult.reason,
					);
				}

				setEmployees(emps);
				setDepartments(depts);

				// Load holidays
				const [weeklyHolidaysResult, dateHolidaysResult] =
					await Promise.allSettled([
						fetchWeeklyHolidays(),
						fetchDateHolidays(),
					]);

				const weeklyHolidayDays =
					weeklyHolidaysResult.status === "fulfilled"
						? weeklyHolidaysResult.value
								.filter((h) => h.isActive)
								.map((h) => h.dayOfWeek)
						: [];
				const fixedHolidayDates =
					dateHolidaysResult.status === "fulfilled"
						? dateHolidaysResult.value.map((h) => h.holidayDate)
						: [];

				// Get current week days
				const weekDays = getCurrentWeekDays();
				const totalEmployeesCount = emps.length;

				const weeklyPromises = weekDays.map(
					async ({ date, dayName, dayOfWeek }) => {
						const dateStr = formatDate(date);
						const isWeeklyHoliday =
							weeklyHolidayDays.includes(dayOfWeek);
						const isFixedHoliday =
							fixedHolidayDates.includes(dateStr);
						const isHoliday = isWeeklyHoliday || isFixedHoliday;

						if (isHoliday) {
							return {
								day: dayName,
								present: 0,
								absent: 0,
								leave: 0,
								isHoliday: true,
							};
						}

						try {
							const summary = await fetchDailySummary(dateStr);
							const present = summary.presentCount || 0;
							const leave = summary.leaveCount || 0;
							// Compute absent as total employees - present - leave (covers case where API returns 0 absent)
							const absent = Math.max(
								0,
								totalEmployeesCount - present - leave,
							);
							return {
								day: dayName,
								present,
								absent,
								leave,
								isHoliday: false,
							};
						} catch (err) {
							console.warn(`No data for ${dateStr}:`, err);
							return {
								day: dayName,
								present: 0,
								absent: totalEmployeesCount, // all absent if no data
								leave: 0,
								isHoliday: false,
							};
						}
					},
				);

				const weeklyResults = await Promise.all(weeklyPromises);
				setWeeklyData(weeklyResults);

				// Load today's summary
				try {
					const summary = await fetchDailySummary(today);
					setTodaySummary(summary);
				} catch (err) {
					console.error("Failed to load today's summary:", err);
				}
			} catch (err) {
				console.error("Dashboard load error:", err);
				setError("Failed to load dashboard data");
			} finally {
				setLoading(false);
			}
		};

		loadDashboard();
	}, [today]);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-slate-500">Loading dashboard...</div>
			</div>
		);
	}

	if (error && employees.length === 0) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-red-600">Error: {error}</div>
			</div>
		);
	}

	const totalEmployees = employees.length;
	const presentToday = todaySummary?.presentCount ?? 0;
	const leaveToday = todaySummary?.leaveCount ?? 0;
	// Use API's absentCount if available, otherwise compute from total
	let absentToday = todaySummary?.absentCount ?? 0;
	if (
		absentToday === 0 &&
		totalEmployees > 0 &&
		presentToday === 0 &&
		leaveToday === 0
	) {
		absentToday = totalEmployees;
	}

	const pieData = [
		{ name: "Present", value: presentToday, color: "#10b981" },
		{ name: "Leave", value: leaveToday, color: "#8b5cf6" },
		{ name: "Absent", value: absentToday, color: "#ef4444" },
	].filter((item) => item.value > 0);

	const todayStaff = todaySummary?.staff ?? [];
	const getDepartmentName = (deptId: string) => {
		return departments.find((d) => d.id === deptId)?.name || deptId;
	};

	const displayStaff = showAllStaff ? todayStaff : todayStaff.slice(0, 10);

	const renderLegend = (props: any) => {
		const { payload } = props;
		return (
			<div className="flex justify-center gap-6 mt-2">
				{payload.map((entry: any, index: number) => (
					<div
						key={`item-${index}`}
						className="flex items-center gap-2"
					>
						<div
							className="h-3 w-3 rounded-full"
							style={{ backgroundColor: entry.color }}
						/>
						<span className="text-xs text-muted-foreground">
							{entry.value}
						</span>
					</div>
				))}
			</div>
		);
	};

	const CustomTooltip = ({ active, payload, label }: any) => {
		if (!active || !payload?.length) return null;
		const dataPoint = weeklyData.find((d) => d.day === label);
		return (
			<div className="rounded-lg border bg-white p-3 shadow-xl min-w-[200px]">
				<p className="mb-1 font-semibold text-gray-900">{label}</p>
				{dataPoint?.isHoliday && (
					<p className="text-xs text-purple-600 mb-2">
						🎉 Holiday (No attendance)
					</p>
				)}
				{payload.map((entry: any, i: number) => (
					<div
						key={i}
						className="flex items-center justify-between gap-4 text-sm mb-1"
					>
						<div className="flex items-center gap-2">
							<div
								className="h-2 w-2 rounded-full"
								style={{ backgroundColor: entry.color }}
							/>
							<span className="text-gray-600">{entry.name}</span>
						</div>
						<span className="font-semibold text-gray-900">
							{entry.value}
						</span>
					</div>
				))}
			</div>
		);
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-foreground">
					Dashboard
				</h1>
				<p className="text-muted-foreground">
					Overview of today's attendance –{" "}
					{new Date().toLocaleDateString("en-US", {
						weekday: "long",
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				<StatsCard
					icon={<Users className="h-6 w-6 text-slate-600" />}
					label="Total Employees"
					value={totalEmployees}
				/>
				<StatsCard
					icon={<UserCheck className="h-6 w-6 text-emerald-600" />}
					label="Present Today"
					value={presentToday}
				/>
				<StatsCard
					icon={<UserX className="h-6 w-6 text-rose-600" />}
					label="Absent Today"
					value={absentToday}
				/>
				<StatsCard
					icon={<CalendarX className="h-6 w-6 text-purple-600" />}
					label="On Leave"
					value={leaveToday}
				/>
			</div>

			{/* Charts Row */}
			<div className="grid gap-4 lg:grid-cols-2">
				{/* Weekly Attendance Bar Chart - Current Week Mon-Sun, only day names */}
				<Card className="border-0 shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
								<TrendingUp className="h-4 w-4 text-primary" />
							</div>
							Weekly Attendance
						</CardTitle>
						<CardDescription>
							Current week (Monday – Sunday) – holidays are
							marked, absent = total - present - leave
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[320px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={weeklyData}
									margin={{
										top: 20,
										right: 30,
										left: 20,
										bottom: 5,
									}}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										opacity={0.3}
									/>
									<XAxis
										dataKey="day"
										tick={{ fontSize: 12 }}
										axisLine={false}
										tickLine={false}
									/>
									<YAxis
										tick={{ fontSize: 12 }}
										axisLine={false}
										tickLine={false}
										domain={[0, "dataMax + 2"]}
										allowDecimals={false}
									/>
									<Tooltip content={<CustomTooltip />} />
									<Legend content={renderLegend} />
									<Bar
										dataKey="present"
										name="Present"
										fill="#10b981"
										radius={[6, 6, 0, 0]}
										maxBarSize={40}
									/>
									<Bar
										dataKey="absent"
										name="Absent"
										fill="#ef4444"
										radius={[6, 6, 0, 0]}
										maxBarSize={40}
									/>
									<Bar
										dataKey="leave"
										name="Leave"
										fill="#8b5cf6"
										radius={[6, 6, 0, 0]}
										maxBarSize={40}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				{/* Today's Distribution Pie Chart */}
				<Card className="border-0 shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
								<Users className="h-4 w-4 text-emerald-500" />
							</div>
							Today's Distribution
						</CardTitle>
						<CardDescription>
							Attendance breakdown for today
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[320px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={pieData}
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={100}
										paddingAngle={3}
										dataKey="value"
										labelLine={false}
										label={({ name, percent }) =>
											`${name} ${(percent * 100).toFixed(0)}%`
										}
									>
										{pieData.map((entry, index) => (
											<Cell
												key={index}
												fill={entry.color}
											/>
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</div>
						<div className="mt-4 text-center text-xs text-muted-foreground">
							Total accounted:{" "}
							{pieData.reduce((sum, item) => sum + item.value, 0)}{" "}
							/ {totalEmployees} employees
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Today's Staff Status List with pagination */}
			<Card className="border-0 shadow-sm">
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-base">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
							<Clock className="h-4 w-4 text-blue-500" />
						</div>
						Today's Staff Status
					</CardTitle>
					<CardDescription>
						Current status of all staff members
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{todayStaff.length === 0 && employees.length > 0 ? (
							<div className="text-center py-12">
								<Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
								<p className="text-muted-foreground">
									No attendance records for today yet
								</p>
							</div>
						) : (
							<>
								{displayStaff.map((item) => {
									const staff = item.staff;
									const deptName = getDepartmentName(
										staff.departmentId,
									);
									const status = item.status;
									let displayStatus = "Not Checked In";
									let statusColor =
										"bg-slate-100 text-slate-700";

									if (status === "leave") {
										displayStatus = "On Leave";
										statusColor =
											"bg-purple-100 text-purple-700";
									} else if (status === "present") {
										displayStatus = "Present";
										statusColor =
											"bg-emerald-100 text-emerald-700";
									} else if (status === "late") {
										displayStatus = "Late";
										statusColor =
											"bg-amber-100 text-amber-700";
									} else if (status === "absent") {
										displayStatus = "Absent";
										statusColor = "bg-red-100 text-red-700";
									}

									return (
										<div
											key={staff.id}
											className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
										>
											<div className="flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B2E4F] text-white text-sm font-semibold">
													{staff.name.charAt(0)}
												</div>
												<div>
													<p className="font-medium text-foreground">
														{staff.name}
													</p>
													<p className="text-sm text-muted-foreground">
														{deptName}
													</p>
												</div>
											</div>
											<Badge
												className={cn(
													"rounded-full px-3 py-1 text-xs font-medium",
													statusColor,
												)}
											>
												{displayStatus}
											</Badge>
										</div>
									);
								})}
								{todayStaff.length > 10 && (
									<div className="flex justify-center pt-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												setShowAllStaff(!showAllStaff)
											}
											className="gap-1 text-[#0B2E4F]"
										>
											{showAllStaff ? (
												<>
													Show less{" "}
													<ChevronUp className="h-4 w-4" />
												</>
											) : (
												<>
													Show all {todayStaff.length}{" "}
													staff{" "}
													<ChevronDown className="h-4 w-4" />
												</>
											)}
										</Button>
									</div>
								)}
							</>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function StatsCard({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: number;
}) {
	return (
		<Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
			<CardContent className="p-4">
				<div className="flex items-center justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<p className="text-sm font-medium text-slate-500 truncate">
							{label}
						</p>
						<p className="text-2xl font-bold text-slate-900">
							{Math.max(0, value)}
						</p>
					</div>
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 shrink-0">
						{icon}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
