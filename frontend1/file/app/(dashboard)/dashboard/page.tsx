"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dataStore } from "@/lib/data-store"
import type { Employee, AttendanceRecord, DailyStats, OutingRequest } from "@/lib/types"
import { Users, UserCheck, UserX, Clock, AlertTriangle, TrendingUp, ArrowLeftRight, DoorOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
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
} from "recharts"

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([])
  const [weeklyData, setWeeklyData] = useState<{ day: string; present: number; absent: number }[]>([])
  const [outingRequests, setOutingRequests] = useState<OutingRequest[]>([])

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    dataStore.init()
    loadData()
  }, [])

  const loadData = () => {
    const emps = dataStore.getEmployees()
    const dailyStats = dataStore.getDailyStats(today)
    const todayAttendance = dataStore.getAttendanceByDate(today)
    const todayOutings = dataStore.getTodayOutingRequests()

    setEmployees(emps)
    setStats(dailyStats)
    setRecentAttendance(todayAttendance)
    setOutingRequests(todayOutings)

    // Calculate WEEKDAY ONLY (Mon - Fri)
    const weekly: { day: string; present: number; absent: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      const dayOfWeek = date.getDay()

      // skip Saturday & Sunday
      if (dayOfWeek === 0 || dayOfWeek === 6) continue

      const dateStr = date.toISOString().split("T")[0]
      const dayStats = dataStore.getDailyStats(dateStr)

      weekly.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        present: dayStats.present,
        absent: dayStats.absent,
      })
    }

    setWeeklyData(weekly)
  }


  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId)
    return emp?.name ?? "Unknown"
  }

  const pendingOutingRequests = outingRequests.filter(r => r.status === "pending")
  const currentlyOutStaff = outingRequests.filter(r => r.status === "approved" && !r.actualReturnTime)

  const pieData = stats ? [
    { name: "Present", value: stats.present, color: "var(--chart-1)" },
    { name: "Absent", value: stats.absent, color: "var(--chart-2)" },
    { name: "Late", value: stats.late, color: "var(--chart-3)" },
    { name: "Leave", value: stats.onLeave, color: "var(--chart-4)" },
  ].filter(item => item.value > 0) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of today&apos;s attendance - {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          icon={<Users className="h-6 w-6 text-slate-600" />}
          label="Total Employees"
          value={employees.length}
        />
        <StatsCard
          icon={<UserCheck className="h-6 w-6 text-emerald-600" />}
          label="Present Today"
          value={stats?.present ?? 0}
        />
        <StatsCard
          icon={<UserX className="h-6 w-6 text-rose-600" />}
          label="Absent Today"
          value={stats?.absent ?? 0}
        />
        <StatsCard
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          label="Late Arrivals"
          value={stats?.late ?? 0}
        />
      </div>

      {/* Outing Requests Alert */}
      {pendingOutingRequests.length > 0 && (
        <Card className="border-0 bg-amber-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <DoorOpen className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {pendingOutingRequests.length} Pending Outing Request{pendingOutingRequests.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Staff members are waiting for approval to go out
                  </p>
                </div>
              </div>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/requests">Review Requests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currently Out Staff */}
      {currentlyOutStaff.length > 0 && (
        <Card className="border-0 bg-emerald-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {currentlyOutStaff.length} Staff Currently Out
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentlyOutStaff.map(r => getEmployeeName(r.employeeId)).join(", ")}
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild className="border-emerald-200 hover:bg-emerald-100">
                <Link href="/requests">View Details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly Attendance Chart */}
     <Card className="border-0 shadow-sm">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-base">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
        <TrendingUp className="h-4 w-4 text-primary" />
      </div>
      Weekly Attendance
    </CardTitle>
    <CardDescription>
      Attendance trend for the last 7 days
    </CardDescription>
  </CardHeader>

  <CardContent>
    <div className="h-[320px] w-full overflow-visible">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={weeklyData} barGap={8} barCategoryGap="25%">

          <CartesianGrid strokeDasharray="3 3" opacity={0.4} />

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
          />

          {/* ✅ CLEAN TOOLTIP (FIXED OVERLAP + BETTER DESIGN) */}
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            content={({ active, payload, label }: any) => {
              if (!active || !payload?.length) return null

              return (
                <div className="rounded-lg border bg-card p-3 shadow-xl min-w-[140px]">
                  <p className="mb-2 font-semibold text-foreground">
                    {label}
                  </p>

                  {payload.map((entry: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span style={{ color: entry.fill }}>
                        {entry.name}
                      </span>
                      <span className="font-medium text-foreground">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              )
            }}
          />

          {/* Bars */}
          <Bar
            dataKey="present"
            name="Present"
            fill="var(--chart-1)"
            radius={[6, 6, 0, 0]}
            maxBarSize={45}
          />

          <Bar
            dataKey="absent"
            name="Absent"
            fill="var(--chart-2)"
            radius={[6, 6, 0, 0]}
            maxBarSize={45}
          />

        </BarChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>

        {/* Today's Distribution */}
        <Card className="border-0 shadow-sm">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-base">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
        <Users className="h-4 w-4 text-emerald-500" />
      </div>
      Today’s Distribution
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
            innerRadius={70}
            outerRadius={110}
            paddingAngle={4}
            dataKey="value"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {pieData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>

          {/* ✅ FIXED TOOLTIP (NO OVERLAP + CLEAN DESIGN) */}
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null

              return (
                <div className="rounded-lg border bg-card p-3 shadow-xl">
                  {payload.map((entry: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-6 text-sm"
                    >
                      <span style={{ color: entry.payload.fill }}>
                        {entry.name}
                      </span>
                      <span className="font-medium">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              )
            }}
          />

        </PieChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            Recent Check-ins
          </CardTitle>
          <CardDescription>Today&apos;s attendance activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAttendance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No attendance records for today</p>
            ) : (
              recentAttendance.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {getEmployeeName(record.employeeId).charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{getEmployeeName(record.employeeId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.checkIn ? `Check-in: ${record.checkIn}` : "Not checked in"}
                        {record.checkOut && ` | Check-out: ${record.checkOut}`}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    record.status === "Present" && "bg-chart-1/20 text-chart-1",
                    record.status === "Late" && "bg-chart-3/20 text-chart-3",
                    record.status === "Absent" && "bg-chart-2/20 text-chart-2",
                    record.status === "Leave" && "bg-muted text-muted-foreground"
                  )}>
                    {record.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
function StatsCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 shrink-0">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
