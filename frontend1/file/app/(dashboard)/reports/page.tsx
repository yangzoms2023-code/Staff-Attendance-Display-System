"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
	FileText,
	Download,
	Calendar,
	Users,
	TrendingUp,
	Eye,
	Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { fetchEmployees, type Employee } from "@/lib/services/employeeApi";
import { fetchDepartments } from "@/lib/services/departmentApi";
import {
	getAttendanceSummary,
	type AttendanceSummary,
} from "@/lib/services/reportApi";

export default function ReportsPage() {
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [departments, setDepartments] = useState<
		{ id: string; name: string }[]
	>([]);
	const [departmentFilter, setDepartmentFilter] = useState<string>("all");
	const [selectedMonth, setSelectedMonth] = useState(() => {
		const date = new Date();
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
			2,
			"0",
		)}`;
	});
	const [loading, setLoading] = useState(true);
	const [reportData, setReportData] = useState<
		Array<{
			employee: Employee;
			summary: AttendanceSummary | null;
		}>
	>([]);
	const [selectedEmployeeSummary, setSelectedEmployeeSummary] =
		useState<AttendanceSummary | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

	// Load departments once
	useEffect(() => {
		const loadDepartments = async () => {
			try {
				const depts = await fetchDepartments();
				setDepartments(depts.map((d) => ({ id: d.id, name: d.name })));
			} catch (err) {
				toast.error("Failed to load departments");
			}
		};
		loadDepartments();
	}, []);

	// Load employees when department filter changes
	useEffect(() => {
		const loadEmployees = async () => {
			try {
				setLoading(true);
				const emps = await fetchEmployees();
				let filtered = emps;
				if (departmentFilter !== "all") {
					filtered = emps.filter(
						(e) => e.departmentId === departmentFilter,
					);
				}
				setEmployees(filtered);
			} catch (err) {
				toast.error("Failed to load employees");
			} finally {
				setLoading(false);
			}
		};
		loadEmployees();
	}, [departmentFilter]);

	// Fetch monthly summary for each employee when month or employees list changes
	useEffect(() => {
		if (employees.length === 0) return;
		const fetchSummaries = async () => {
			const [year, month] = selectedMonth.split("-").map(Number);
			const results = await Promise.allSettled(
				employees.map(async (emp) => {
					try {
						const summary = await getAttendanceSummary(
							year,
							month,
							emp.id,
						);
						return { employee: emp, summary };
					} catch (err) {
						console.error(`Failed for ${emp.name}:`, err);
						return { employee: emp, summary: null };
					}
				}),
			);
			const data = results.map((r) =>
				r.status === "fulfilled"
					? r.value
					: { employee: null, summary: null },
			);
			setReportData(
				data.filter((d) => d.employee !== null) as {
					employee: Employee;
					summary: AttendanceSummary | null;
				}[],
			);
		};
		fetchSummaries();
	}, [employees, selectedMonth]);

	const handleViewDetails = async (employee: Employee) => {
		const [year, month] = selectedMonth.split("-").map(Number);
		try {
			const summary = await getAttendanceSummary(
				year,
				month,
				employee.id,
			);
			setSelectedEmployeeSummary(summary);
			setIsDetailsOpen(true);
		} catch (err) {
			toast.error("Failed to load employee details");
		}
	};

	const exportToCSV = () => {
		const headers = [
			"Employee ID",
			"Name",
			"Department",
			"Present",
			"Absent",
			"Leave",
			"Attendance %",
			"Working Days",
		];
		const rows = reportData.map((item) => {
			const summary = item.summary;
			const attendancePercent =
				summary && summary.totalWorkingDays > 0
					? Math.round(
							(summary.presentCount / summary.totalWorkingDays) *
								100,
						)
					: 0;
			const deptName =
				departments.find((d) => d.id === item.employee.departmentId)
					?.name || "";
			return [
				item.employee.employeeId,
				item.employee.name,
				deptName,
				summary?.presentCount || 0,
				summary?.absentCount || 0,
				summary?.leaveCount || 0,
				`${attendancePercent}%`,
				summary?.totalWorkingDays || 0,
			];
		});
		const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
			"\n",
		);
		const blob = new Blob([csv], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `attendance-report-${selectedMonth}.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	// Stats from the fetched data
	const totalEmployees = reportData.length;
	const avgAttendance = reportData.length
		? Math.round(
				reportData.reduce((sum, item) => {
					const summary = item.summary;
					const percent =
						summary && summary.totalWorkingDays > 0
							? (summary.presentCount /
									summary.totalWorkingDays) *
								100
							: 0;
					return sum + percent;
				}, 0) / reportData.length,
			)
		: 0;
	const totalPresentDays = reportData.reduce(
		(sum, item) => sum + (item.summary?.presentCount || 0),
		0,
	);
	const workingDays = reportData[0]?.summary?.totalWorkingDays || 0;

	// Department stats for chart (using unique ID as key)
	const departmentStats = departments
		.map((dept) => {
			const deptEmployees = reportData.filter(
				(item) => item.employee.departmentId === dept.id,
			);
			const avgAtt =
				deptEmployees.length > 0
					? Math.round(
							deptEmployees.reduce((sum, item) => {
								const summary = item.summary;
								const percent =
									summary && summary.totalWorkingDays > 0
										? (summary.presentCount /
												summary.totalWorkingDays) *
											100
										: 0;
								return sum + percent;
							}, 0) / deptEmployees.length,
						)
					: 0;
			return {
				id: dept.id,
				name: dept.name,
				avgAttendance: avgAtt,
				employees: deptEmployees.length,
			};
		})
		.filter((d) => d.employees > 0);

<<<<<<< HEAD
	return (
		<div className="w-full min-w-0 overflow-hidden">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
				<div className="space-y-1">
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
						Reports
					</h1>
					<p className="text-sm sm:text-base text-slate-500">
						Monthly attendance summary
					</p>
				</div>
				<Button
					onClick={exportToCSV}
					className="gap-2 bg-[#0B2E4F] text-white hover:bg-white hover:text-[#0B2E4F] border border-[#0B2E4F] transition-colors"
				>
					<Download className="h-4 w-4" />
					Export CSV
				</Button>
			</div>

			{/* Filters */}
			<Card className="border border-slate-200 shadow-none bg-white mb-6">
				<CardContent className="p-3 sm:p-4">
					<div className="flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4 text-slate-400" />
							<span className="text-sm text-slate-500">
								Month:
							</span>
							<Select
								value={selectedMonth}
								onValueChange={setSelectedMonth}
							>
								<SelectTrigger className="w-[180px] h-9 border-slate-200 focus:border-[#0B2E4F]">
									<SelectValue placeholder="Select Month" />
								</SelectTrigger>
								<SelectContent>
									{(() => {
										const months = [];
										const today = new Date();
										for (let i = 0; i < 12; i++) {
											const date = new Date(
												today.getFullYear(),
												today.getMonth() - i,
												1,
											);
											const monthStr = `${date.getFullYear()}-${String(
												date.getMonth() + 1,
											).padStart(2, "0")}`;
											const monthName =
												date.toLocaleDateString(
													"en-US",
													{
														month: "long",
														year: "numeric",
													},
												);
											months.push({
												value: monthStr,
												label: monthName,
											});
										}
										return months;
									})().map((month) => (
										<SelectItem
											key={month.value}
											value={month.value}
											className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
										>
											{month.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-slate-400">
								Working Days:
							</span>
							<span className="text-sm font-medium text-slate-700">
								{workingDays} days
							</span>
						</div>
						<Select
							value={departmentFilter}
							onValueChange={setDepartmentFilter}
						>
							<SelectTrigger className="w-[180px] h-9 border-slate-200 focus:border-[#0B2E4F]">
								<Building2 className="h-4 w-4 mr-2 text-slate-500" />
								<SelectValue placeholder="Department" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem
									value="all"
									className="hover:bg-[#0B2E4F] hover:text-white"
								>
									All Departments
								</SelectItem>
								{departments.map((dept) => (
									<SelectItem
										key={dept.id}
										value={dept.id}
										className="hover:bg-[#0B2E4F] hover:text-white"
									>
										{dept.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Stats Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
				<StatCard
					label="Total Employees"
					value={totalEmployees}
					icon={<Users className="h-4 w-4" />}
					iconBgColor="bg-slate-100"
					iconColor="text-slate-600"
				/>
				<StatCard
					label="Avg Attendance"
					value={`${avgAttendance}%`}
					icon={<TrendingUp className="h-4 w-4" />}
					iconBgColor="bg-emerald-50"
					iconColor="text-emerald-600"
				/>
				<StatCard
					label="Total Present Days"
					value={totalPresentDays}
					icon={<FileText className="h-4 w-4" />}
					iconBgColor="bg-emerald-50"
					iconColor="text-emerald-600"
				/>
				<StatCard
					label="Working Days"
					value={workingDays}
					icon={<Calendar className="h-4 w-4" />}
					iconBgColor="bg-blue-50"
					iconColor="text-blue-600"
				/>
			</div>

			{/* Tabs – only Employee and Department */}
			<Tabs defaultValue="employee" className="space-y-4">
				<TabsList className="bg-slate-100 p-1 rounded-lg">
					<TabsTrigger
						value="employee"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-900"
					>
						By Employee
					</TabsTrigger>
					<TabsTrigger
						value="department"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-900"
					>
						By Department
					</TabsTrigger>
				</TabsList>

				{/* Employee Table */}
				<TabsContent value="employee">
					<div className="w-full overflow-x-auto">
						<div className="min-w-[900px]">
							{/* Header */}
							<div className="grid grid-cols-[80px_1.5fr_1.2fr_0.8fr_0.8fr_0.8fr_100px] gap-3 border-b border-slate-200 bg-[#0B2E4F] rounded-t-lg px-4">
								<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
									ID
								</div>
								<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
									Employee
								</div>
								<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
									Department
								</div>
								<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
									Present
								</div>
								<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
									Absent
								</div>
								<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
									Leave
								</div>
								<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
									Actions
								</div>
							</div>

							{loading ? (
								<div className="h-32 flex items-center justify-center text-slate-500 border border-slate-200 rounded-b-lg mt-[-1px] bg-white">
									Loading...
								</div>
							) : reportData.length === 0 ? (
								<div className="h-32 flex flex-col items-center justify-center text-slate-400 border border-slate-200 rounded-b-lg mt-[-1px] bg-white">
									<Users className="h-8 w-8 mb-2 opacity-50" />
									<p className="text-sm font-medium">
										No data available
									</p>
								</div>
							) : (
								reportData.map((item, idx) => {
									const summary = item.summary;
									const attendancePercent =
										summary && summary.totalWorkingDays > 0
											? Math.round(
													(summary.presentCount /
														summary.totalWorkingDays) *
														100,
												)
											: 0;
									const deptName =
										departments.find(
											(d) =>
												d.id ===
												item.employee.departmentId,
										)?.name || "";
									return (
										<div
											key={item.employee.id}
											className={cn(
												"grid grid-cols-[80px_1.5fr_1.2fr_0.8fr_0.8fr_0.8fr_100px] gap-3 items-center border-l border-r border-b border-slate-200 px-4",
												idx % 2 === 0
													? "bg-[#FDFDFD]"
													: "bg-[#F6F6F6]",
											)}
										>
											<div className="py-3 text-xs font-mono">
												{item.employee.employeeId}
											</div>
											<div className="py-3 text-sm font-medium truncate">
												{item.employee.name}
											</div>
											<div className="py-3 text-sm text-slate-700 truncate">
												{deptName}
											</div>
											<div className="py-3 text-center">
												<Badge className="bg-emerald-50 text-emerald-700 border-0">
													{summary?.presentCount || 0}
												</Badge>
											</div>
											<div className="py-3 text-center">
												<Badge className="bg-red-50 text-red-700 border-0">
													{summary?.absentCount || 0}
												</Badge>
											</div>
											<div className="py-3 text-center">
												<Badge className="bg-purple-50 text-purple-700 border-0">
													{summary?.leaveCount || 0}
												</Badge>
											</div>
											<div className="py-3 flex justify-center">
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														handleViewDetails(
															item.employee,
														)
													}
													className="h-8 w-8 text-slate-400 hover:text-[#0B2E4F]"
												>
													<Eye className="h-4 w-4" />
												</Button>
											</div>
										</div>
									);
								})
							)}
						</div>
					</div>
				</TabsContent>

				{/* Department Bar Chart (fixed duplicate key) */}
				<TabsContent value="department">
					<Card className="border border-slate-200 shadow-none bg-white">
						<CardContent className="p-4 sm:p-6">
							<div className="h-[400px]">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart
										data={departmentStats}
										layout="vertical"
									>
										<CartesianGrid
											strokeDasharray="3 3"
											className="stroke-slate-200"
										/>
										<XAxis
											type="number"
											domain={[0, 100]}
											tick={{ fill: "#64748B" }}
										/>
										<YAxis
											dataKey="id"
											type="category"
											width={120}
											tick={{ fill: "#64748B" }}
											tickFormatter={(id) =>
												departmentStats.find(
													(d) => d.id === id,
												)?.name || ""
											}
										/>
										<Tooltip
											formatter={(value: number) => [
												`${value}%`,
												"Avg Attendance",
											]}
										/>
										<Bar
											dataKey="avgAttendance"
											fill="#0B2E4F"
											radius={[0, 4, 4, 0]}
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
=======
  // Handle month selection
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    const [year, monthNum] = month.split('-')
    const firstDay = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0)
    setStartDate(firstDay.toISOString().split("T")[0])
    setEndDate(lastDay.toISOString().split("T")[0])
  }

  // Generate available months for selection (last 12 months)
  const getAvailableMonths = () => {
    const months: string[] = []
    const today = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months.push(monthStr)
    }
    return months
  }

  const generateReport = () => {
    let filteredEmployees = [...employees]
    if (departmentFilter !== "all") {
      filteredEmployees = filteredEmployees.filter(e => e.department === departmentFilter)
    }
>>>>>>> 44f5bc6f4faea486054a2d1c35801993fdb9fc2d

			{/* Employee Details Modal */}
			<Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Employee Attendance Details</DialogTitle>
						<DialogDescription>
							{selectedEmployeeSummary &&
								`${selectedEmployeeSummary.staff.name} - ${selectedEmployeeSummary.staff.employeeId}`}
						</DialogDescription>
					</DialogHeader>
					{selectedEmployeeSummary && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="p-3 bg-slate-50 rounded-lg">
									<p className="text-xs text-slate-500">
										Total Working Days
									</p>
									<p className="text-lg font-semibold">
										{
											selectedEmployeeSummary.totalWorkingDays
										}
									</p>
								</div>
								<div className="p-3 bg-slate-50 rounded-lg">
									<p className="text-xs text-slate-500">
										Holidays
									</p>
									<p className="text-lg font-semibold">
										{selectedEmployeeSummary.holidayCount}
									</p>
								</div>
								<div className="p-3 bg-emerald-50 rounded-lg">
									<p className="text-xs text-emerald-600">
										Present
									</p>
									<p className="text-lg font-semibold text-emerald-700">
										{selectedEmployeeSummary.presentCount}
									</p>
								</div>
								<div className="p-3 bg-red-50 rounded-lg">
									<p className="text-xs text-red-600">
										Absent
									</p>
									<p className="text-lg font-semibold text-red-700">
										{selectedEmployeeSummary.absentCount}
									</p>
								</div>
								<div className="p-3 bg-purple-50 rounded-lg">
									<p className="text-xs text-purple-600">
										Leave
									</p>
									<p className="text-lg font-semibold text-purple-700">
										{selectedEmployeeSummary.leaveCount}
									</p>
								</div>
							</div>
							{selectedEmployeeSummary.absentDates.length > 0 && (
								<div>
									<h4 className="text-sm font-medium text-slate-900 mb-2">
										Absent Dates
									</h4>
									<div className="flex flex-wrap gap-2">
										{selectedEmployeeSummary.absentDates.map(
											(date) => (
												<Badge
													key={date}
													variant="secondary"
													className="bg-red-50 text-red-700"
												>
													{new Date(
														date,
													).toLocaleDateString()}
												</Badge>
											),
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

<<<<<<< HEAD
function StatCard({
	label,
	value,
	icon,
	iconBgColor,
	iconColor,
}: {
	label: string;
	value: string | number;
	icon: React.ReactNode;
	iconBgColor: string;
	iconColor: string;
}) {
	return (
		<Card className="border-0 shadow-sm">
			<CardContent className="p-3 sm:p-4">
				<div className="flex items-center justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
							{label}
						</p>
						<p className="text-xl sm:text-2xl font-bold text-slate-900">
							{value}
						</p>
					</div>
					<div
						className={cn(
							"h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0",
							iconBgColor,
						)}
					>
						<div className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)}>
							{icon}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
=======
    const allAttendance = dataStore.getAttendance()
    const reports: ReportData[] = filteredEmployees.map((employee) => {
      const records = allAttendance.filter(
        (a) =>
          a.employeeId === employee.id &&
          a.date >= startDate &&
          a.date <= endDate
      )

      const presentDays = records.filter(r => r.status === "Present").length
      const lateDays = records.filter(r => r.status === "Late").length
      const absentDays = records.filter(r => r.status === "Absent").length
      const leaveDays = records.filter(r => r.status === "Leave").length
      // Calculate attendance percentage based on working days only
      const attendancePercentage = totalWorkingDays > 0
        ? Math.round(((presentDays + lateDays) / totalWorkingDays) * 100)
        : 0

      return {
        employee,
        records,
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        attendancePercentage,
      }
    })

    setReportData(reports)
    generateTrendData(filteredEmployees, allAttendance, workingDays)
  }

  const generateTrendData = (filteredEmployees: Employee[], allAttendance: AttendanceRecord[], workingDays: string[]) => {
    const trend: { date: string; present: number; absent: number; late: number }[] = []
    workingDays.forEach((dateStr) => {
      const records = allAttendance.filter(
        (a) =>
          a.date === dateStr &&
          filteredEmployees.some((e) => e.id === a.employeeId)
      )

      const date = new Date(dateStr)
      trend.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        present: records.filter(r => r.status === "Present").length,
        absent: records.filter(r => r.status === "Absent").length +
          (filteredEmployees.length - records.filter(r => r.status === "Present" || r.status === "Late").length),
        late: records.filter(r => r.status === "Late").length,
      })
    })

    setTrendData(trend)
  }

  const exportToCSV = () => {
    const workingDays = getWorkingDaysList(startDate, endDate)
    const headers = [
      "Employee ID",
      "Name",
      "Department",
      "Present Days",
      "Late Days",
      "Absent Days",
      "Leave Days",
      `Attendance % (out of ${workingDays.length} working days)`,
    ]

    const rows = reportData.map((r) => [
      r.employee.employeeId,
      r.employee.name,
      r.employee.department,
      r.presentDays,
      r.lateDays,
      r.absentDays,
      r.leaveDays,
      `${r.attendancePercentage}%`,
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-report-${startDate}-to-${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const departmentStats = DEPARTMENTS.map((dept) => {
    const deptEmployees = reportData.filter((r) => r.employee.department === dept)
    const avgAttendance =
      deptEmployees.length > 0
        ? Math.round(
          deptEmployees.reduce((sum, r) => sum + r.attendancePercentage, 0) /
          deptEmployees.length
        )
        : 0
    return { department: dept, employees: deptEmployees.length, avgAttendance }
  }).filter((d) => d.employees > 0)

  const workingDaysCount = getWorkingDaysList(startDate, endDate).length
  const overallStats = {
    totalEmployees: reportData.length,
    avgAttendance:
      reportData.length > 0
        ? Math.round(
          reportData.reduce((sum, r) => sum + r.attendancePercentage, 0) /
          reportData.length
        )
        : 0,
    totalPresent: reportData.reduce((sum, r) => sum + r.presentDays + r.lateDays, 0),
    totalAbsent: reportData.reduce((sum, r) => sum + r.absentDays, 0),
    workingDays: workingDaysCount,
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-amber-100 text-amber-700",
      "bg-rose-100 text-rose-700",
      "bg-violet-100 text-violet-700",
      "bg-cyan-100 text-cyan-700",
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Reports</h1>
          <p className="text-sm sm:text-base text-slate-500">
            Generate monthly attendance reports (Monday-Friday working days only)
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          className="gap-2 bg-[#0B2E4F] text-white hover:bg-white hover:text-[#0B2E4F] border border-[#0B2E4F]
          shadow-sm h-9 sm:h-10 px-4 sm:px-5 shrink-0 self-start sm:self-auto w-full sm:w-auto transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border border-slate-200 shadow-none bg-white mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-500">Month:</span>
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[180px] h-9 border-slate-200 focus:border-[#0B2E4F]">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMonths().map((month) => {
                    const [year, monthNum] = month.split('-')
                    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
                    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    return (
                      <SelectItem
                        key={month}
                        value={month}
                        className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white transition-colors"
                      >
                        {monthName}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Working Days:</span>
              <span className="text-sm font-medium text-slate-700">{workingDaysCount} days</span>
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px] h-9 border-slate-200 focus:border-[#0B2E4F]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="all"
                  className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white transition-colors"
                >
                  All Departments
                </SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem
                    key={dept}
                    value={dept}
                    className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white transition-colors"
                  >
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Total Employees</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{overallStats.totalEmployees}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Avg Attendance</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600">{overallStats.avgAttendance}%</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Total Present Days</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600">{overallStats.totalPresent}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Working Days</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{overallStats.workingDays}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different report views */}
      <Tabs defaultValue="employee" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="employee" className="text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">By Employee</TabsTrigger>
          <TabsTrigger value="department" className="text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">By Department</TabsTrigger>
          <TabsTrigger value="trend" className="text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Attendance Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="employee" className="space-y-4">
          {/* Employee Report Table */}
          <div className="w-full overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <div className="min-w-[900px] sm:min-w-full">
              {/* Table Header */}
              <div className="grid grid-cols-[80px_1.5fr_1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr] gap-3 border-b border-slate-200 bg-[#0B2E4F] rounded-t-lg px-4">
                <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
                  ID
                </div>
                <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
                  Employee
                </div>
                <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
                  Department
                </div>
                <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
                  Present
                </div>
                <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
                  Late
                </div>
                <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
                  Absent
                </div>
                <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
                  Leave
                </div>
                <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
                  Attendance %
                </div>
              </div>

              {/* Table Body */}
              {reportData.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-slate-400 border border-slate-200 rounded-b-lg mt-[-1px] bg-white">
                  <Users className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No data available</p>
                  <p className="text-xs mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                reportData.map((report, index) => (
                  <div
                    key={report.employee.id}
                    className={cn(
                      "grid grid-cols-[80px_1.5fr_1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr] gap-3 items-center border-l border-r border-b border-slate-200 transition-colors px-4",
                      index % 2 === 0 ? "bg-[#FDFDFD]" : "bg-[#F6F6F6]",
                      index === 0 && "border-t",
                      index === reportData.length - 1 && "rounded-b-lg"
                    )}
                  >
                    <div className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs text-slate-900 rounded font-medium">
                        {report.employee.employeeId}
                      </span>
                    </div>

                    <div className="py-3 min-w-0">
                      <p className="text-xs sm:text-sm text-slate-700 truncate">{report.employee.name}</p>
                    </div>

                    <div className="py-3">
                      <span className="text-xs sm:text-sm text-slate-700 truncate block">
                        {report.employee.department}
                      </span>
                    </div>

                    <div className="py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-xs font-medium text-emerald-700">
                        {report.presentDays}
                      </span>
                    </div>

                    <div className="py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-xs font-medium text-amber-700">
                        {report.lateDays}
                      </span>
                    </div>

                    <div className="py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-xs font-medium text-red-700">
                        {report.absentDays}
                      </span>
                    </div>

                    <div className="py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-xs font-medium text-blue-700">
                        {report.leaveDays}
                      </span>
                    </div>

                    <div className="py-3 text-center">
                      <div
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          report.attendancePercentage >= 90 && "bg-emerald-50 text-emerald-700",
                          report.attendancePercentage >= 70 && report.attendancePercentage < 90 && "bg-amber-50 text-amber-700",
                          report.attendancePercentage < 70 && "bg-red-50 text-red-700"
                        )}
                      >
                        {report.attendancePercentage}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="department" className="space-y-4">
          <Card className="border border-slate-200 shadow-none bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748B' }} />
                    <YAxis dataKey="department" type="category" width={120} tick={{ fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        color: '#0F172A',
                      }}
                      formatter={(value: number) => [`${value}%`, "Avg Attendance"]}
                    />
                    <Bar dataKey="avgAttendance" fill="#0B2E4F" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <Card className="border border-slate-200 shadow-none bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B' }} />
                    <YAxis tick={{ fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        color: '#0F172A',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="#10B981" strokeWidth={2} name="Present" />
                    <Line type="monotone" dataKey="absent" stroke="#EF4444" strokeWidth={2} name="Absent" />
                    <Line type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={2} name="Late" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
>>>>>>> 44f5bc6f4faea486054a2d1c35801993fdb9fc2d
