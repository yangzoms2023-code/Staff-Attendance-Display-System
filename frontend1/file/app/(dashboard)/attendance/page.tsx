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
import { CalendarCheck, Search, UserCheck, UserX, Clock, ChevronLeft, ChevronRight, Users, MoreHorizontal, Pencil, Eye, CalendarX, Lock } from "lucide-react"
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

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0]
  
  // Check if selected date is today
  const isToday = selectedDate === today
  
  // Check if selected date is in the past
  const isPastDate = selectedDate < today
  
  // Check if selected date is in the future
  const isFutureDate = selectedDate > today
  
  // Check if selected date is editable (only today is editable)
  const isEditable = isToday

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
    // For future dates, return empty attendance (no records)
    if (isFutureDate) {
      setAttendance([])
      return
    }
    const att = dataStore.getAttendanceByDate(selectedDate)
    setAttendance(att)
  }

  const getEmployeeAttendance = (employeeId: string): AttendanceRecord | undefined => {
    // For future dates, always return undefined (no attendance recorded)
    if (isFutureDate) {
      return undefined
    }
    return attendance.find(a => a.employeeId === employeeId)
  }

  const handleMarkAttendance = (
    employeeId: string,
    status: AttendanceRecord["status"],
    checkIn?: string,
    checkOut?: string
  ) => {
    if (!isEditable) return // Prevent editing if not today
    
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
    if (!isEditable) return // Prevent editing if not today
    
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    const isLate = now.getHours() >= 9 && now.getMinutes() > 30
    handleMarkAttendance(employeeId, isLate ? "Late" : "Present", timeStr)
  }

  const handleQuickCheckOut = (employeeId: string) => {
    if (!isEditable) return // Prevent editing if not today
    
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
    if (!isEditable) return // Prevent opening dialog if not today
    
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

  // Calculate stats based on date type
  const getStats = () => {
    if (isFutureDate) {
      // Future dates: all zeros
      return {
        total: filteredEmployees.length,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
      }
    }
    
    // Past or today: calculate from actual records
    return {
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
  }

  const stats = getStats()

  const getStatusBadge = (record?: AttendanceRecord) => {
    if (!record) {
      return <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0">Not Recorded</Badge>
    }
    
    const statusColors: Record<string, string> = {
      Present: "bg-emerald-50 text-emerald-700",
      Late: "bg-amber-50 text-amber-700",
      Absent: "bg-red-50 text-red-700",
      Leave: "bg-purple-50 text-purple-700",
      "Half-Day": "bg-indigo-50 text-indigo-700",
    }
    
    return (
      <Badge variant="secondary" className={cn("px-2 py-0.5 text-xs font-medium border-0", 
      statusColors[record.status])}>
        <span className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full inline-block",
          record.status === "Present" ? "bg-emerald-500" :
          record.status === "Late" ? "bg-amber-500" :
          record.status === "Absent" ? "bg-red-500" :
          record.status === "Leave" ? "bg-purple-500" : "bg-indigo-500"
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
        <StatCard label="Total" value={stats.total} icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} 
        iconBgColor="bg-violet-100" iconColor="text-violet-600" />
        <StatCard label="Present" value={stats.present} icon={<UserCheck className="h-4 w-4 sm:h-5 
        sm:w-5" />} iconBgColor="bg-emerald-100" iconColor="text-emerald-600" />
        <StatCard label="Absent" value={stats.absent} icon={<UserX className="h-4 w-4 sm:h-5 sm:w-5" 
        />} iconBgColor="bg-red-100" iconColor="text-red-600" />
        <StatCard label="Late" value={stats.late} icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />} 
        iconBgColor="bg-amber-100" iconColor="text-amber-600" />
        <StatCard label="On Leave" value={stats.leave} icon={<CalendarX className="h-4 w-4 sm:h-5 
        sm:w-5" />} iconBgColor="bg-purple-100" iconColor="text-purple-600" />
      </div>

      {/* Date Navigation and Filters */}
      <Card className="border border-slate-200 shadow-none bg-white mb-4">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Date Navigation */}
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => changeDate(-1)} 
                className="h-9 w-9 border-slate-200 hover:bg-[#0B2E4F] hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[160px] h-9 border-slate-200 focus:border-[#0B2E4F] focus:ring-[#0B2E4F]"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => changeDate(1)} 
                className="h-9 w-9 border-slate-200 hover:bg-[#0B2E4F] hover:text-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                className="h-9 border-slate-200 hover:bg-[#0B2E4F] hover:text-white transition-colors"
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
                  className="pl-10 w-full sm:w-[200px] h-9 border-slate-200 focus:border-[#0B2E4F] 
                  focus:ring-[#0B2E4F]"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 border-slate-200 focus:border-[#0B2E4F]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    value="all"
                    className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] 
                    focus:text-white transition-colors"
                  >
                    All Departments
                  </SelectItem>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem 
                      key={dept} 
                      value={dept}
                      className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] 
                      focus:text-white transition-colors"
                    >
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Read-only warning message - separate div */}
      {!isEditable && (
        <div className="mb-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-md">
          <Lock className="h-4 w-4 flex-shrink-0" />
          <span>
            {isPastDate 
              ? "Past attendance records are view-only. You cannot edit or modify past dates." 
              : "Future attendance records cannot be edited. Attendance can only be marked for today."}
          </span>
        </div>
      )}

      {/* Attendance Table */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Table Header */}
          <div className="grid grid-cols-[100px_1.5fr_1.2fr_1fr_0.8fr_0.8fr_0.5fr] gap-4 border-b 
          border-slate-200 bg-[#0B2E4F] rounded-t-lg px-4">
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
            <div className="h-32 flex flex-col items-center justify-center text-slate-400 border 
            border-slate-200 rounded-b-lg mt-[-1px] bg-white">
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
                    index === filteredEmployees.length - 1 && "rounded-b-lg",
                    !isEditable && "opacity-90"
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
                    {isEditable ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-[#0B2E4F] 
                            transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 p-1">
                          {(!record || record.status === "Absent") && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleQuickCheckIn(employee.id)}
                                className="gap-2 text-sm cursor-pointer hover:bg-[#0B2E4F] hover:text-white 
                                focus:bg-[#0B2E4F] focus:text-white transition-colors"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                Quick Check In
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleMarkAttendance(employee.id, "Absent")}
                                className="gap-2 text-sm text-red-600 cursor-pointer hover:bg-red-50 
                                hover:text-red-700 focus:bg-red-50 focus:text-red-700 transition-colors"
                              >
                                <UserX className="h-3.5 w-3.5" />
                                Mark Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleMarkAttendance(employee.id, "Leave")}
                                className="gap-2 text-sm text-purple-600 cursor-pointer hover:bg-purple-50 
                                hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700 transition-colors"
                              >
                                <CalendarX className="h-3.5 w-3.5" />
                                Mark Leave
                              </DropdownMenuItem>
                            </>
                          )}
                          {record?.checkIn && !record?.checkOut && (
                            <DropdownMenuItem 
                              onClick={() => handleQuickCheckOut(employee.id)}
                              className="gap-2 text-sm cursor-pointer hover:bg-[#0B2E4F] hover:text-white 
                              focus:bg-[#0B2E4F] focus:text-white transition-colors"
                            >
                              <UserX className="h-3.5 w-3.5" />
                              Quick Check Out
                            </DropdownMenuItem>
                          )}
                          {record && record.status !== "Absent" && (
                            <DropdownMenuItem 
                              onClick={() => openMarkDialog(employee, record)}
                              className="gap-2 text-sm cursor-pointer hover:bg-[#0B2E4F] hover:text-white 
                              focus:bg-[#0B2E4F] focus:text-white transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit Attendance
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 cursor-not-allowed opacity-50"
                        disabled
                        title={isPastDate ? "Cannot edit past attendance records" : "Cannot edit future attendance records"}
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Mark Attendance Dialog - Only shown when editable */}
      <Dialog open={isMarkDialogOpen && isEditable} onOpenChange={setIsMarkDialogOpen}>
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
                <SelectTrigger className="h-10 border-slate-300 rounded-md focus:ring-2 focus:ring-[#0B2E4F] 
                focus:border-[#0B2E4F]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    value="Present"
                    className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] 
                    focus:text-white transition-colors"
                  >
                    Present
                  </SelectItem>
                  <SelectItem 
                    value="Late"
                    className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] 
                    focus:text-white transition-colors"
                  >
                    Late
                  </SelectItem>
                  <SelectItem 
                    value="Absent"
                    className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] 
                    focus:text-white transition-colors"
                  >
                    Absent
                  </SelectItem>
                  <SelectItem 
                    value="Leave"
                    className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] 
                    focus:text-white transition-colors"
                  >
                    Leave
                  </SelectItem>
                  <SelectItem 
                    value="Half-Day"
                    className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] 
                    focus:text-white transition-colors"
                  >
                    Half-Day
                  </SelectItem>
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
                      className="h-10 border-slate-300 rounded-md focus:ring-2 focus:ring-[#0B2E4F] 
                      focus:border-[#0B2E4F]"
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
                      className="h-10 border-slate-300 rounded-md focus:ring-2 focus:ring-[#0B2E4F] 
                      focus:border-[#0B2E4F]"
                    />
                  </div>
                </div>
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
              className="gap-2 bg-red-600 text-white shadow-sm h-10 px-5 shrink-0 self-start 
              sm:self-auto border-2 border-transparent hover:bg-white hover:text-red-600 
              hover:border-red-600 transition-colors"
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
              className="gap-2 bg-[#0b2e4f] text-white shadow-sm h-10 px-5 shrink-0 self-start 
              sm:self-auto border-2 border-transparent hover:bg-white hover:text-[#0b2e4f] 
              hover:border-[#0b2e4f] transition-colors"
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
            <div className={cn("h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0", 
            iconBgColor)}>
              <div className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)}>{icon}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}