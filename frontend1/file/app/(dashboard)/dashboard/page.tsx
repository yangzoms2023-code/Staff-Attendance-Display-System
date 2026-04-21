"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dataStore } from "@/lib/data-store"
import type { Employee, AttendanceRecord, DailyStats, OutingRequest } from "@/lib/types"
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  ArrowLeftRight,
  DoorOpen,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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
  const [weeklyData, setWeeklyData] = useState<
    { day: string; present: number; absent: number }[]
  >([])
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

    const weekly: { day: string; present: number; absent: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
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
    const emp = employees.find((e) => e.id === employeeId)
    return emp?.name ?? "Unknown"
  }

  const pendingOutingRequests = outingRequests.filter(
    (r) => r.status === "pending"
  )

  const currentlyOutStaff = outingRequests.filter(
    (r) => r.status === "approved" && !r.actualReturnTime
  )

  const pieData = stats
    ? [
        { name: "Present", value: stats.present, color: "var(--chart-1)" },
        { name: "Absent", value: stats.absent, color: "var(--chart-2)" },
        { name: "Late", value: stats.late, color: "var(--chart-3)" },
        { name: "Leave", value: stats.onLeave, color: "var(--chart-4)" },
      ].filter((item) => item.value > 0)
    : []

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of today’s attendance
        </p>
      </div>

      {/* ⭐ STATS CARDS (YOUR REQUESTED SECTION) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

        <StatsCard
          icon={<Users className="h-5 w-5" />}
          label="Total Employees"
          value={stats?.totalEmployees ?? 0}
          trend={{ value: 8.5, isPositive: true }}
          trendLabel="Up from yesterday"
          iconBgColor="bg-violet-100"
          iconColor="text-violet-500"
        />

        <StatsCard
          icon={<UserCheck className="h-5 w-5" />}
          label="Present Today"
          value={stats?.present ?? 0}
          trend={{ value: 1.3, isPositive: true }}
          trendLabel="Up from past week"
          iconBgColor="bg-amber-100"
          iconColor="text-amber-500"
        />

        <StatsCard
          icon={<UserX className="h-5 w-5" />}
          label="Absent Today"
          value={stats?.absent ?? 0}
          trend={{ value: 1.8, isPositive: false }}
          trendLabel="Down from yesterday"
          iconBgColor="bg-orange-100"
          iconColor="text-orange-500"
        />

        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          label="Late Arrivals"
          value={stats?.late ?? 0}
          trend={{ value: 4.3, isPositive: false }}
          trendLabel="Down from yesterday"
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-500"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Weekly */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Weekly Attendance
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="present" fill="var(--chart-1)" />
                  <Bar dataKey="absent" fill="var(--chart-2)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Today’s Distribution</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={100}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {recentAttendance.length === 0 ? (
              <p className="text-muted-foreground">No records</p>
            ) : (
              recentAttendance.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex justify-between border p-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {getEmployeeName(record.employeeId)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {record.checkIn ?? "Not checked in"}
                    </p>
                  </div>

                  <span className="text-xs px-2 py-1 bg-muted rounded-full">
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

/* ⭐ STATS CARD COMPONENT */
function StatsCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  iconBgColor,
  iconColor,
}: {
  icon: React.ReactNode
  label: string
  value: number
  trend?: { value: number; isPositive: boolean }
  trendLabel?: string
  iconBgColor: string
  iconColor: string
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center justify-between">

        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>

          {trend && (
            <p
              className={cn(
                "text-xs",
                trend.isPositive ? "text-emerald-500" : "text-red-500"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}% {trendLabel}
            </p>
          )}
        </div>

        <div className={cn("p-2 rounded-full", iconBgColor, iconColor)}>
          {icon}
        </div>

      </CardContent>
    </Card>
  )
}