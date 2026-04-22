"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { dataStore, DEPARTMENTS } from "@/lib/data-store"
import type { Employee, AttendanceRecord } from "@/lib/types"
import { CalendarCheck, Search, UserCheck, UserX, Clock, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  useEffect(() => {
    dataStore.init()
    loadData()
  }, [])

  useEffect(() => {
    loadAttendance()
  }, [selectedDate])


  const loadData = () => {
    const emps = dataStore.getEmployees().filter(e => e.status === "Active")
    setEmployees(emps)
    loadAttendance()
  }

  const loadAttendance = () => {
    const att = dataStore.getAttendanceByDate(selectedDate)
    setAttendance(att)
  }

  const getEmployeeAttendance = (employeeId: string): AttendanceRecord | undefined => {
    return attendance.find(a => a.employeeId === employeeId)
  }

  const handleMarkAttendance = (
    employeeId: string,
    status: AttendanceRecord["status"],
    checkIn?: string,
    checkOut?: string
  ) => {
    dataStore.markAttendance({
      employeeId,
      date: selectedDate,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      status,
      remarks: "",
    })
    loadAttendance()
  }

  const handleQuickCheckIn = (employeeId: string) => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    const isLate = now.getHours() >= 9 && now.getMinutes() > 30
    handleMarkAttendance(employeeId, isLate ? "Late" : "Present", timeStr)
  }

  const handleQuickCheckOut = (employeeId: string) => {
    const record = getEmployeeAttendance(employeeId)
    if (!record) return
    
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    
    dataStore.markAttendance({
      ...record,
      checkOut: timeStr,
    })
    loadAttendance()
  }

  const changeDate = (days: number) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().split("T")[0])
  }

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = searchQuery
      ? emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter
    return matchesSearch && matchesDepartment
  })

  const stats = {
    total: filteredEmployees.length,
    present: filteredEmployees.filter(e => {
      const record = getEmployeeAttendance(e.id)
      return record?.status === "Present" || record?.status === "Late"
    }).length,
    absent: filteredEmployees.filter(e => {
      const record = getEmployeeAttendance(e.id)
      return !record || record.status === "Absent"
    }).length,
    late: filteredEmployees.filter(e => {
      const record = getEmployeeAttendance(e.id)
      return record?.status === "Late"
    }).length,
    leave: filteredEmployees.filter(e => {
      const record = getEmployeeAttendance(e.id)
      return record?.status === "Leave"
    }).length,
  }

  const getStatusBadge = (record?: AttendanceRecord) => {
    if (!record) {
      return <Badge variant="secondary" className="bg-muted">Not Recorded</Badge>
    }
    
    const statusColors: Record<string, string> = {
      Present: "bg-chart-1/20 text-chart-1",
      Late: "bg-chart-3/20 text-chart-3",
      Absent: "bg-chart-2/20 text-chart-2",
      Leave: "bg-muted text-muted-foreground",
      "Half-Day": "bg-chart-4/20 text-chart-4",
    }
    
    return (
      <Badge variant="secondary" className={cn(statusColors[record.status])}>
        {record.status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
        <p className="text-muted-foreground">
          Track and manage daily employee attendance
        </p>
      </div>

      {/* Date Navigation and Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[160px]"
              />
              <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              >
                Today
              </Button>
            </div>

            <div className="flex-1" />

            {/* Search and Filters */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[200px]"
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Total" value={stats.total} icon={<Users className="h-5 w-5" />} iconBgColor="bg-violet-100" iconColor="text-violet-500" />
        <StatCard label="Present" value={stats.present} icon={<UserCheck className="h-5 w-5" />} iconBgColor="bg-emerald-100" iconColor="text-emerald-500" />
        <StatCard label="Absent" value={stats.absent} icon={<UserX className="h-5 w-5" />} iconBgColor="bg-red-100" iconColor="text-red-500" />
        <StatCard label="Late" value={stats.late} icon={<Clock className="h-5 w-5" />} iconBgColor="bg-amber-100" iconColor="text-amber-500" />
        <StatCard label="On Leave" value={stats.leave} icon={<CalendarCheck className="h-5 w-5" />} iconBgColor="bg-blue-100" iconColor="text-blue-500" />
      </div>

      {/* Attendance Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <CalendarCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <CardTitle className="text-base">
              Attendance for {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </CardTitle>
          </div>
          <CardDescription>
            Mark attendance for each employee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => {
                    const record = getEmployeeAttendance(employee.id)
                    
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {employee.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{getStatusBadge(record)}</TableCell>
                        <TableCell>
                          {record?.checkIn || "-"}
                        </TableCell>
                        <TableCell>
                          {record?.checkOut || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {!record || record.status === "Absent" ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickCheckIn(employee.id)}
                                  className="gap-1"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  Check In
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkAttendance(employee.id, "Absent")}
                                  className="gap-1 text-destructive hover:text-destructive"
                                >
                                  <UserX className="h-3 w-3" />
                                  Absent
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkAttendance(employee.id, "Leave")}
                                  className="gap-1"
                                >
                                  <Clock className="h-3 w-3" />
                                  Leave
                                </Button>
                              </>
                            ) : record.checkIn && !record.checkOut ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickCheckOut(employee.id)}
                                className="gap-1"
                              >
                                <UserX className="h-3 w-3" />
                                Check Out
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">Completed</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, iconBgColor, iconColor, icon }: { 
  label: string
  value: number
  iconBgColor?: string
  iconColor?: string
  icon?: React.ReactNode
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon && (
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", iconBgColor)}>
              <div className={iconColor}>{icon}</div>
            </div>
          )}
        </div>
        <p className="mt-2 text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  )
}
