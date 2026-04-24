"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { dataStore, DEPARTMENTS } from "@/lib/data-store"
import type { Employee, AttendanceRecord } from "@/lib/types"
import { CalendarCheck, Search, UserCheck, UserX, Clock, ChevronLeft, ChevronRight, Users, MoreHorizontal, Pencil, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [markStatus, setMarkStatus] = useState<AttendanceRecord["status"]>("Present")
  const [checkInTime, setCheckInTime] = useState("")
  const [checkOutTime, setCheckOutTime] = useState("")

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
    setIsMarkDialogOpen(false)
    setSelectedEmployee(null)
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

  const openMarkDialog = (employee: Employee, currentRecord?: AttendanceRecord) => {
    setSelectedEmployee(employee)
    if (currentRecord) {
      setMarkStatus(currentRecord.status)
      setCheckInTime(currentRecord.checkIn || "")
      setCheckOutTime(currentRecord.checkOut || "")
    } else {
      setMarkStatus("Present")
      setCheckInTime("")
      setCheckOutTime("")
    }
    setIsMarkDialogOpen(true)
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
      return <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0">Not Recorded</Badge>
    }
    
    const statusColors: Record<string, string> = {
      Present: "bg-emerald-50 text-emerald-700",
      Late: "bg-amber-50 text-amber-700",
      Absent: "bg-red-50 text-red-700",
      Leave: "bg-blue-50 text-blue-700",
      "Half-Day": "bg-purple-50 text-purple-700",
    }
    
    return (
      <Badge variant="secondary" className={cn("px-2 py-0.5 text-xs font-medium border-0", statusColors[record.status])}>
        <span className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full inline-block",
          record.status === "Present" ? "bg-emerald-500" :
          record.status === "Late" ? "bg-amber-500" :
          record.status === "Absent" ? "bg-red-500" :
          record.status === "Leave" ? "bg-blue-500" : "bg-purple-500"
        )} />
        {record.status}
      </Badge>
    )
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Attendance</h1>
          <p className="text-sm sm:text-base text-slate-500">
            Track and manage daily employee attendance
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total" value={stats.total} icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} iconBgColor="bg-violet-100" iconColor="text-violet-600" />
        <StatCard label="Present" value={stats.present} icon={<UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />} iconBgColor="bg-emerald-100" iconColor="text-emerald-600" />
        <StatCard label="Absent" value={stats.absent} icon={<UserX className="h-4 w-4 sm:h-5 sm:w-5" />} iconBgColor="bg-red-100" iconColor="text-red-600" />
        <StatCard label="Late" value={stats.late} icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />} iconBgColor="bg-amber-100" iconColor="text-amber-600" />
        <StatCard label="On Leave" value={stats.leave} icon={<CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5" />} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
      </div>

      {/* Date Navigation and Filters */}
      <Card className="border border-slate-200 shadow-none bg-white mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Date Navigation */}
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="icon" onClick={() => changeDate(-1)} className="h-9 w-9 border-slate-200">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[160px] h-9 border-slate-200"
              />
              <Button variant="outline" size="icon" onClick={() => changeDate(1)} className="h-9 w-9 border-slate-200">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                className="h-9 border-slate-200"
              >
                Today
              </Button>
            </div>

            <div className="flex-1" />

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search employee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-[200px] h-9 border-slate-200"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 border-slate-200">
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
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Table Header */}
          <div className="grid grid-cols-[100px_1.5fr_1.2fr_1fr_0.8fr_0.8fr_0.5fr] gap-4 border-b border-slate-200 bg-[#0B2E4F] rounded-t-lg px-4">
            <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
              ID
            </div>
            <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
              Employee
            </div>
            <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
              Department
            </div>
            <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
              Status
            </div>
            <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
              Check In
            </div>
            <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
              Check Out
            </div>
            <div className="py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
              Actions
            </div>
          </div>

          {/* Table Body */}
          {filteredEmployees.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-slate-400 border border-slate-200 rounded-b-lg mt-[-1px] bg-white">
              <Users className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No employees found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredEmployees.map((employee, index) => {
              const record = getEmployeeAttendance(employee.id)
              
              return (
                <div 
                  key={employee.id}
                  className={cn(
                    "grid grid-cols-[100px_1.5fr_1.2fr_1fr_0.8fr_0.8fr_0.5fr] gap-4 items-center border-l border-r border-b border-slate-200 transition-colors px-4",
                    index % 2 === 0 ? "bg-[#FDFDFD]" : "bg-[#F6F6F6]",
                    index === 0 && "border-t",
                    index === filteredEmployees.length - 1 && "rounded-b-lg"
                  )}
                >
                  <div className="py-3">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium text-slate-700">
                      {employee.employeeId}
                    </span>
                  </div>

                  <div className="py-3 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{employee.name}</p>
                  </div>

                  <div className="py-3">
                    <span className="text-sm text-slate-700 truncate block">{employee.department}</span>
                  </div>

                  <div className="py-3">
                    {getStatusBadge(record)}
                  </div>

                  <div className="py-3">
                    <span className="text-sm text-slate-700 font-mono">{record?.checkIn || "-"}</span>
                  </div>

                  <div className="py-3">
                    <span className="text-sm text-slate-700 font-mono">{record?.checkOut || "-"}</span>
                  </div>

                  <div className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {(!record || record.status === "Absent") && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleQuickCheckIn(employee.id)}
                              className="gap-2 text-sm"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                              Quick Check In
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleMarkAttendance(employee.id, "Absent")}
                              className="gap-2 text-sm text-red-600"
                            >
                              <UserX className="h-3.5 w-3.5" />
                              Mark Absent
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleMarkAttendance(employee.id, "Leave")}
                              className="gap-2 text-sm text-blue-600"
                            >
                              <CalendarCheck className="h-3.5 w-3.5" />
                              Mark Leave
                            </DropdownMenuItem>
                          </>
                        )}
                        {record?.checkIn && !record?.checkOut && (
                          <DropdownMenuItem 
                            onClick={() => handleQuickCheckOut(employee.id)}
                            className="gap-2 text-sm"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            Quick Check Out
                          </DropdownMenuItem>
                        )}
                        {record && record.status !== "Absent" && (
                          <DropdownMenuItem 
                            onClick={() => openMarkDialog(employee, record)}
                            className="gap-2 text-sm"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Attendance
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Mark Attendance Dialog */}
<Dialog open={isMarkDialogOpen} onOpenChange={setIsMarkDialogOpen}>
  <DialogContent className="max-w-md p-6">
    {/* Header */}
    <DialogHeader className="border-b border-slate-200 pb-4">
      <DialogTitle className="text-lg font-semibold text-slate-900">
        Mark Attendance
      </DialogTitle>
      <DialogDescription className="text-sm text-slate-500">
        {selectedEmployee?.name} • {new Date(selectedDate).toLocaleDateString()}
      </DialogDescription>
    </DialogHeader>

    {/* Body */}
    <div className="py-6 space-y-6">
      {/* Status Selector */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Status
        </label>
        <Select
          value={markStatus}
          onValueChange={(value) =>
            setMarkStatus(value as AttendanceRecord["status"])
          }
        >
          <SelectTrigger className="h-10 border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Present">Present</SelectItem>
            <SelectItem value="Late">Late</SelectItem>
            <SelectItem value="Absent">Absent</SelectItem>
            <SelectItem value="Leave">Leave</SelectItem>
            <SelectItem value="Half-Day">Half-Day</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Time Inputs */}
{(markStatus === "Present" ||
  markStatus === "Late" ||
  markStatus === "Half-Day") && (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
    <h4 className="text-sm font-semibold text-slate-800">
      Attendance Timing
    </h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Check In Time
        </label>
        <Input
          type="time"
          value={checkInTime}
          onChange={(e) => setCheckInTime(e.target.value)}
          className="h-10 border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Check Out Time
        </label>
        <Input
          type="time"
          value={checkOutTime}
          onChange={(e) => setCheckOutTime(e.target.value)}
          className="h-10 border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400"
        />
      </div>
    </div>
    {/* Optional live preview */}
    {(checkInTime || checkOutTime) && (
      <p className="text-xs text-slate-500">
        Selected: {checkInTime || "--:--"} – {checkOutTime || "--:--"}
      </p>
    )}
  </div>
)}

    </div>

    {/* Footer */}
    <DialogFooter className="border-t border-slate-200 pt-4 flex-col sm:flex-row gap-3">
      <Button
        variant="outline"
        onClick={() => setIsMarkDialogOpen(false)}
        className="gap-2 bg-[#ba0f0f] text-white shadow-sm h-10 px-5 shrink-0 self-start sm:self-auto border-2 border-transparent hover:bg-white hover:text-[#ba0f0f] hover:border-[#ba0f0f] transition-colors"
      >
        Cancel
      </Button>
      <Button
        onClick={() => {
          if (selectedEmployee) {
            handleMarkAttendance(
              selectedEmployee.id,
              markStatus,
              checkInTime || undefined,
              checkOutTime || undefined
            )
          }
        }}
        className="gap-2 bg-[#0b2e4f] text-white shadow-sm h-10 px-5 shrink-0 self-start sm:self-auto border-2 border-transparent hover:bg-white hover:text-[#0b2e4f] hover:border-[#0b2e4f] transition-colors"
      >
        Save Attendance
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
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
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{label}</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
          </div>
          {icon && (
            <div className={cn("h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0", iconBgColor)}>
              <div className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)}>{icon}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}