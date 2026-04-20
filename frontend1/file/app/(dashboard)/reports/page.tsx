"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { dataStore, DEPARTMENTS } from "@/lib/data-store"
import type { Employee, AttendanceRecord, ReportData } from "@/lib/types"
import { FileText, Download, Calendar, Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts"

export default function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [trendData, setTrendData] = useState<{ date: string; present: number; absent: number; late: number }[]>([])

  useEffect(() => {
    dataStore.init()
    loadData()
  }, [])

  useEffect(() => {
    generateReport()
  }, [employees, startDate, endDate, departmentFilter])

  const loadData = () => {
    const emps = dataStore.getEmployees().filter(e => e.status === "Active")
    setEmployees(emps)
  }

  const generateReport = () => {
    let filteredEmployees = [...employees]
    
    if (departmentFilter !== "all") {
      filteredEmployees = filteredEmployees.filter(e => e.department === departmentFilter)
    }

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
      const totalWorkingDays = getWorkingDays(startDate, endDate)
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
    generateTrendData(filteredEmployees, allAttendance)
  }

  const generateTrendData = (filteredEmployees: Employee[], allAttendance: AttendanceRecord[]) => {
    const trend: { date: string; present: number; absent: number; late: number }[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        const dateStr = current.toISOString().split("T")[0]
        const dayRecords = allAttendance.filter(
          (a) =>
            a.date === dateStr &&
            filteredEmployees.some((e) => e.id === a.employeeId)
        )

        trend.push({
          date: current.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          present: dayRecords.filter(r => r.status === "Present").length,
          absent: dayRecords.filter(r => r.status === "Absent").length + 
                  (filteredEmployees.length - dayRecords.length),
          late: dayRecords.filter(r => r.status === "Late").length,
        })
      }
      current.setDate(current.getDate() + 1)
    }

    setTrendData(trend)
  }

  const getWorkingDays = (start: string, end: string): number => {
    const startD = new Date(start)
    const endD = new Date(end)
    let count = 0

    while (startD <= endD) {
      if (startD.getDay() !== 0 && startD.getDay() !== 6) {
        count++
      }
      startD.setDate(startD.getDate() + 1)
    }

    return count
  }

  const exportToCSV = () => {
    const headers = [
      "Employee ID",
      "Name",
      "Department",
      "Present Days",
      "Late Days",
      "Absent Days",
      "Leave Days",
      "Attendance %",
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
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export attendance reports
          </p>
        </div>
        <Button onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">From:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                <Users className="h-5 w-5 text-violet-500" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{overallStats.totalEmployees}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">Avg Attendance</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{overallStats.avgAttendance}%</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Present Days</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{overallStats.totalPresent}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Absent Days</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <FileText className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{overallStats.totalAbsent}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different report views */}
      <Tabs defaultValue="employee" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employee">By Employee</TabsTrigger>
          <TabsTrigger value="department">By Department</TabsTrigger>
          <TabsTrigger value="trend">Attendance Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="employee" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                  <Users className="h-4 w-4 text-violet-500" />
                </div>
                Employee Attendance Report
              </CardTitle>
              <CardDescription>
                Individual attendance records for {startDate} to {endDate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Late</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-center">Leave</TableHead>
                      <TableHead className="text-center">Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.map((report) => (
                        <TableRow key={report.employee.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {report.employee.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{report.employee.name}</p>
                                <p className="text-sm text-muted-foreground">{report.employee.employeeId}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{report.employee.department}</TableCell>
                          <TableCell className="text-center">
                            <span className="rounded-full bg-chart-1/20 px-2 py-1 text-sm font-medium text-chart-1">
                              {report.presentDays}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="rounded-full bg-chart-3/20 px-2 py-1 text-sm font-medium text-chart-3">
                              {report.lateDays}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="rounded-full bg-chart-2/20 px-2 py-1 text-sm font-medium text-chart-2">
                              {report.absentDays}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="rounded-full bg-muted px-2 py-1 text-sm font-medium text-muted-foreground">
                              {report.leaveDays}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div
                              className={cn(
                                "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
                                report.attendancePercentage >= 90 && "bg-chart-1/20 text-chart-1",
                                report.attendancePercentage >= 70 && report.attendancePercentage < 90 && "bg-chart-3/20 text-chart-3",
                                report.attendancePercentage < 70 && "bg-chart-2/20 text-chart-2"
                              )}
                            >
                              {report.attendancePercentage}%
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                Department-wise Attendance
              </CardTitle>
              <CardDescription>
                Average attendance by department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'currentColor' }} className="text-muted-foreground" />
                    <YAxis dataKey="department" type="category" width={120} tick={{ fill: 'currentColor' }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}%`, "Avg Attendance"]}
                    />
                    <Bar dataKey="avgAttendance" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                Attendance Trend
              </CardTitle>
              <CardDescription>
                Daily attendance pattern over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fill: 'currentColor' }} className="text-muted-foreground" />
                    <YAxis tick={{ fill: 'currentColor' }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="var(--chart-1)" strokeWidth={2} name="Present" />
                    <Line type="monotone" dataKey="absent" stroke="var(--chart-2)" strokeWidth={2} name="Absent" />
                    <Line type="monotone" dataKey="late" stroke="var(--chart-3)" strokeWidth={2} name="Late" />
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
