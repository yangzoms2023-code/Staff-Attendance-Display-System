"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { dataStore } from "@/lib/data-store"
import type { Employee, AttendanceRecord, OutingRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LogIn, LogOut, Clock, CalendarDays, DoorOpen, Send, CheckCircle, History, User, ChevronDown, Menu, LayoutDashboard, Monitor, User2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  {
    title: "Dashboard",
    url: "/staff",
    icon: LayoutDashboard,
  },
  {
    title: "My Profile",
    url: "/staff/profile",
    icon: User,
  },
]

export default function StaffDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [outingRequests, setOutingRequests] = useState<OutingRequest[]>([])
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Outing request form state
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [purpose, setPurpose] = useState<"official" | "personal">("official")
  const [reason, setReason] = useState("")
  const [willReturn, setWillReturn] = useState(true)
  const [expectedReturnTime, setExpectedReturnTime] = useState("")
  const [outingError, setOutingError] = useState("")

  const today = new Date().toISOString().split("T")[0]

  // Helper: get late threshold from settings (default 09:30)
  const getLateThreshold = (): string => {
    if (typeof window === 'undefined') return "09:30"
    const settingsRaw = localStorage.getItem("tda_settings")
    if (settingsRaw) {
      try {
        const settings = JSON.parse(settingsRaw)
        return settings.lateThreshold || "09:30"
      } catch (e) {
        return "09:30"
      }
    }
    return "09:30"
  }

  // Helper: compare times using minutes since midnight
  const isTimeAfterThreshold = (timeStr: string, thresholdStr: string): boolean => {
    const [h1, m1] = timeStr.split(":").map(Number)
    const [h2, m2] = thresholdStr.split(":").map(Number)
    return (h1 * 60 + m1) > (h2 * 60 + m2)
  }

  // Helper: check if time1 is after time2
  const isTimeAfter = (time1: string, time2: string): boolean => {
    const [h1, m1] = time1.split(":").map(Number)
    const [h2, m2] = time2.split(":").map(Number)
    return (h1 * 60 + m1) > (h2 * 60 + m2)
  }

  // Helper: get min time for return (current time + 15 minutes)
  const getMinReturnTime = (): string => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 15)
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  }

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    
    if (user.role !== "employee") {
      router.push("/dashboard")
      return
    }

    dataStore.init()
    
    const employees = dataStore.getEmployees()
    let emp: Employee | undefined
    
    if (user.employeeId) {
      emp = employees.find(e => e.employeeId === user.employeeId || e.id === user.employeeId)
    }
    
    if (!emp && user.username) {
      emp = employees.find(e => e.name === user.name)
    }
    
    if (!emp) {
      emp = {
        id: user.employeeId || user.id,
        employeeId: user.employeeId || user.username,
        name: user.name,
        gender: "Other",
        designation: "Staff",
        contactNumber: "",
        email: user.email,
        address: "",
        department: user.department || "General",
        joiningDate: new Date().toISOString().split("T")[0],
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
    
    setEmployee(emp)

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [user, router])

  useEffect(() => {
    if (employee) {
      loadEmployeeData()
    }
  }, [employee])

  const loadEmployeeData = () => {
    if (!employee) return
    
    const allAttendance = dataStore.getAttendance()
    const todayAttendance = allAttendance.find(a => a.employeeId === employee.id && a.date === today)
    setAttendance(todayAttendance || null)

    const history: AttendanceRecord[] = []
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const record = allAttendance.find(r => r.employeeId === employee.id && r.date === dateStr)
      if (record) {
        history.push(record)
      }
    }
    setAttendanceHistory(history)

    const empOutings = dataStore.getOutingRequestsByEmployee(employee.id)
    setOutingRequests(empOutings.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    })
  }

  const getCurrentTime24 = () => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  }

  const handleCheckIn = () => {
    if (!employee) return
    const time = getCurrentTime24()
    const threshold = getLateThreshold()
    const isLate = isTimeAfterThreshold(time, threshold)
    
    const newRecord: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt"> = {
      employeeId: employee.id,
      date: today,
      checkIn: time,
      checkOut: null,
      status: isLate ? "Late" : "Present",
      remarks: isLate ? `Checked in late (threshold ${threshold})` : ""
    }
    
    dataStore.markAttendance(newRecord)
    loadEmployeeData()
  }

  const handleCheckOut = () => {
    if (!employee || !attendance) return
    
    // Do not allow check-out while on an approved outing
    if (currentOuting) {
      alert("Cannot check out while on approved outing. Please mark return first.")
      return
    }
    
    const time = getCurrentTime24()
    const checkInTime = attendance.checkIn
    
    // Validate check-out is after check-in
    if (!isTimeAfter(time, checkInTime)) {
      alert("Check-out time cannot be before check-in time")
      return
    }
    
    const updatedRecord = {
      ...attendance,
      checkOut: time,
      remarks: attendance.remarks ? `${attendance.remarks}; Checked out at ${time}` : `Checked out at ${time}`,
      updatedAt: new Date().toISOString()
    }
    
    dataStore.markAttendance(updatedRecord)
    loadEmployeeData()
  }

  const handleSubmitOutingRequest = () => {
    if (!employee || !reason) {
      setOutingError("Please provide a reason for the outing")
      return
    }

    if (willReturn && !expectedReturnTime) {
      setOutingError("Please specify expected return time")
      return
    }

    if (willReturn && expectedReturnTime) {
      const minReturnTime = getMinReturnTime()
      if (!isTimeAfter(expectedReturnTime, minReturnTime)) {
        setOutingError(`Expected return time must be at least 15 minutes from now (minimum: ${minReturnTime})`)
        return
      }
    }

    dataStore.createOutingRequest({
      employeeId: employee.id,
      date: today,
      requestTime: getCurrentTime24(),
      purpose,
      reason,
      willReturn,
      expectedReturnTime: willReturn ? expectedReturnTime : null
    })

    setPurpose("official")
    setReason("")
    setWillReturn(true)
    setExpectedReturnTime("")
    setOutingError("")
    setRequestDialogOpen(false)
    loadEmployeeData()
  }

  const handleMarkReturn = (requestId: string) => {
    if (!employee) return
    
    const outing = outingRequests.find(r => r.id === requestId)
    if (!outing) return
    
    const returnTime = getCurrentTime24()
    const expectedTime = outing.expectedReturnTime
    
    if (expectedTime && isTimeAfter(returnTime, expectedTime)) {
      if (!confirm(`You are returning late (expected: ${expectedTime}, actual: ${returnTime}). Do you want to continue?`)) {
        return
      }
    }
    
    dataStore.markOutingReturn(requestId)
    loadEmployeeData()
  }

  const handleLogout = () => {
    localStorage.removeItem("tda_current_user")
    logout()
    router.push("/")
  }

  const confirmLogout = () => {
    setLogoutDialogOpen(true)
  }

  const executeLogout = () => {
    setLogoutDialogOpen(false)
    handleLogout()
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    const statusConfig = {
      Present: { className: "bg-green-100 text-green-800", label: "Present" },
      Late: { className: "bg-yellow-100 text-yellow-800", label: "Late" },
      Absent: { className: "bg-red-100 text-red-800", label: "Absent" },
      Leave: { className: "bg-blue-100 text-blue-800", label: "On Leave" },
      "Half-Day": { className: "bg-orange-100 text-orange-800", label: "Half-Day" }
    }
    const config = statusConfig[status] || { className: "bg-gray-100 text-gray-800", label: status }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getOutingStatusBadge = (status: OutingRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "denied":
        return <Badge className="bg-red-100 text-red-800">Denied</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCheckInButtonTooltip = () => {
    if (!canCheckIn) return "You have already checked in today"
    return "Check in to start your work day"
  }

  const getCheckOutButtonTooltip = () => {
    if (!hasCheckedIn) return "Please check in first"
    if (hasCheckedOut) return "You have already checked out today"
    if (currentOuting) return "Cannot check out while on approved outing. Please mark return first"
    return "Check out to end your work day"
  }

  const getOutingButtonTooltip = () => {
    if (!hasCheckedIn) return "Please check in first"
    if (hasCheckedOut) return "Cannot request outing after checking out"
    if (currentOuting) return "You already have an active outing"
    if (pendingOuting) return "You have a pending outing request"
    return "Request permission to go out during work hours"
  }

  const getReturnButtonTooltip = () => {
    if (!currentOuting) return "No active outing to return from"
    return "Mark your return to office"
  }

  const currentOuting = outingRequests.find(
    r => r.date === today && r.status === "approved" && !r.actualReturnTime
  )

  const pendingOuting = outingRequests.find(
    r => r.date === today && r.status === "pending"
  )

  // Derived button states
  const hasCheckedIn = !!attendance?.checkIn
  const hasCheckedOut = !!attendance?.checkOut
  const canCheckIn = !hasCheckedIn
  const canCheckOut = hasCheckedIn && !hasCheckedOut && !currentOuting
  const canRequestOuting = hasCheckedIn && !hasCheckedOut && !currentOuting && !pendingOuting
  const canMarkReturn = !!currentOuting

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading employee data...</div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="relative flex min-h-screen flex-col">
        {/* Background Pattern */}
        <div 
          className="fixed inset-0 bg-repeat opacity-10 -z-10"
          style={{ backgroundImage: "url('/images/bg-pattern.png')" }}
        />
        
        <div className="relative z-10">
          {/* Header */}
          <header className="flex items-center justify-between bg-white shadow-sm px-6 md:px-10 py-3 border-b border-slate-200 sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center">
                <Image src="/icon.png" alt="Logo" width={48} height={48} className="object-contain"/>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">Staff Portal</h1>
                <p className="text-xs text-slate-500">Thimphu Dzongkhag Administration</p>
              </div>
            </div>
            
            {/* Desktop Profile Dropdown */}
            <div className="hidden md:flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hover:bg-slate-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B2E4F] text-white text-sm font-semibold">
                      {employee.name.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-700">{employee.name.split(' ')[0]}</span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-3 border-b">
                    <p className="font-semibold text-slate-900">{employee.name}</p>
                    <p className="text-sm text-slate-500">{employee.designation}</p>
                    <p className="text-xs text-slate-400 mt-1">{employee.email}</p>
                  </div>
                  <DropdownMenuItem 
                    className="gap-2 cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white transition-colors"
                    onClick={() => router.push("/staff/profile")}
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="gap-2 cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white transition-colors" 
                    onClick={confirmLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5 text-slate-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
                <div className="flex flex-col h-full bg-white">
                  <div className="border-b border-slate-200 p-4">
                    <Link href="/staff" onClick={closeMobileMenu} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                        <Image src="/icon.png" alt="Logo" width={40} height={40} className="object-contain"/>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">Thimphu Dzongkhag</span>
                        <span className="text-xs text-slate-500">Attendance System</span>
                      </div>
                    </Link>
                  </div>
                  <div className="flex-1 py-4">
                    <div className="px-3 mb-2">
                      <p className="text-xs font-semibold text-slate-400 px-3 py-2">Navigation</p>
                    </div>
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.url
                      return (
                        <Link
                          key={item.url}
                          href={item.url}
                          onClick={closeMobileMenu}
                          className={`flex items-center gap-3 px-6 py-2.5 mx-2 rounded-lg transition-colors ${
                            isActive 
                              ? "bg-[#0B2E4F] text-white" 
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                  <div className="border-t border-slate-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B2E4F]">
                        <User2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{employee?.name}</p>
                        <p className="text-xs text-slate-500 capitalize">Employee</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        confirmLogout()
                        closeMobileMenu()
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </header>

          {/* Main Content */}
          <main className="px-6 md:px-10 lg:px-14 py-8 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-[#0B2E4F] to-[#1a456b] rounded-lg p-5 md:p-7 mb-8 text-white shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 md:h-20 md:w-20 items-center justify-center rounded-full bg-white/20 text-white text-2xl md:text-3xl font-bold shadow-lg">
                    {employee.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold">Welcome back, {employee.name.split(' ')[0]}!</h2>
                    <p className="text-white/80 text-base md:text-lg mt-1">{employee.designation} • {employee.department}</p>
                    <p className="text-white/60 text-sm mt-1">ID: {employee.employeeId}</p>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100/20">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-widest hidden md:block">Current Status</span>
                    {attendance?.status && getStatusBadge(attendance.status)}
                  </div>
                  {currentOuting && (
                    <Badge className="bg-purple-500/30 text-white border-purple-500/50 backdrop-blur-sm hover:bg-purple-500/40 transition-all shadow-sm">
                      Currently Out
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Daily Attendance Section */}
            <Card className="border-none shadow-sm gap-1">
              <CardHeader>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Daily Attendance</h3>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                
                {/* Check In */}
                <div className="flex items-center justify-between gap-3 pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        attendance?.checkIn
                          ? "bg-slate-200 text-slate-500"
                          : "bg-emerald-500 text-white shadow-md"
                      )}
                    >
                      <LogIn className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                        Check In
                      </p>
                      <p className="text-sm font-bold text-slate-900 leading-none">
                        {attendance?.checkIn ?? formatTime(currentTime)}
                      </p>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          size="sm"
                          onClick={handleCheckIn}
                          disabled={!canCheckIn}
                          className={cn(
                            "h-8 px-4 rounded-lg font-bold transition-all",
                            !canCheckIn
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          )}
                        >
                          {attendance?.checkIn ? "Done" : "In"}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getCheckInButtonTooltip()}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 p-2" />

                {/* Check Out */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        !canCheckOut
                          ? "bg-slate-200 text-slate-500"
                          : "bg-rose-500 text-white shadow-md"
                      )}
                    >
                      <LogOut className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                        Check Out
                      </p>
                      <p className="text-sm font-bold text-slate-900 leading-none">
                        {attendance?.checkOut
                          ? attendance.checkOut
                          : attendance?.checkIn
                          ? formatTime(currentTime)
                          : "Not Yet"}
                      </p>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          size="sm"
                          variant={!canCheckOut ? "secondary" : "destructive"}
                          onClick={handleCheckOut}
                          disabled={!canCheckOut}
                          className={cn(
                            "h-8 px-4 rounded-lg font-bold",
                            !canCheckOut && "cursor-not-allowed"
                          )}
                        >
                          Out
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getCheckOutButtonTooltip()}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

              </CardContent>
            </Card>

            {/* Outing Management Section */}
            <Card className="border-none shadow-sm gap-1 mt-6 mb-6">
              <CardHeader>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Outing Management</h3>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                
                {/* Outing Request */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      !canRequestOuting ? "bg-slate-200 text-slate-500" : "bg-blue-500 text-white shadow-md"
                    )}>
                      <DoorOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Outing</p>
                      <p className="text-sm font-bold text-slate-900 leading-none">
                        {pendingOuting ? "Pending Approval" : currentOuting ? "Currently Out" : "Ready"}
                      </p>
                      {pendingOuting && (
                        <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Awaiting approval
                        </p>
                      )}
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button 
                          size="sm" 
                          onClick={() => setRequestDialogOpen(true)} 
                          disabled={!canRequestOuting}
                          className={cn("h-8 px-4 rounded-lg font-bold", 
                            !canRequestOuting ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
                          )}
                        >
                          {pendingOuting ? "Pending" : currentOuting ? "On Outing" : "Request"}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getOutingButtonTooltip()}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 p-2" />

                {/* Mark Return */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      !canMarkReturn ? "bg-slate-200 text-slate-500" : "bg-indigo-600 text-white shadow-md"
                    )}>
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Return</p>
                      <p className="text-sm font-bold text-slate-900 leading-none">
                        {currentOuting ? "Mark Return" : "No Active Outing"}
                      </p>
                      {currentOuting && currentOuting.expectedReturnTime && (
                        <p className="text-xs text-slate-500 mt-1">
                          Expected: {currentOuting.expectedReturnTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button 
                          size="sm" 
                          onClick={() => currentOuting && handleMarkReturn(currentOuting.id)} 
                          disabled={!canMarkReturn}
                          className={cn("h-8 px-4 rounded-lg font-bold", 
                            !canMarkReturn ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-indigo-700 text-white"
                          )}
                        >
                          Return
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getReturnButtonTooltip()}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            {/* History Section */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-4">History & Records</h3>
              
              <Tabs defaultValue="attendance" className="space-y-4">
                <TabsList className="bg-white border">
                  <TabsTrigger 
                    value="attendance" 
                    className="gap-2 data-[state=active]:bg-[#0B2E4F] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-700 hover:data-[state=inactive]:bg-slate-50"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Attendance History
                  </TabsTrigger>
                  <TabsTrigger 
                    value="outings" 
                    className="gap-2 data-[state=active]:bg-[#0B2E4F] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-700 hover:data-[state=inactive]:bg-slate-50"
                  >
                    <History className="h-4 w-4" />
                    Outing Requests
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="attendance">
                  <Card className="border-0 shadow-md bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Recent Attendance</CardTitle>
                      <CardDescription>Your attendance records for the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {attendanceHistory.length === 0 ? (
                        <div className="text-center py-12">
                          <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">No attendance records found</p>
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-[#0B2E4F]">
                                <tr>
                                  <th className="text-left text-white font-semibold py-3 px-4">Date</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">Day</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">Status</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">Check In</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">Check Out</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {attendanceHistory.map((record, index) => (
                                  <tr 
                                    key={record.id}
                                    className={cn(
                                      "border-b border-slate-200",
                                      index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                                    )}
                                  >
                                    <td className="py-3 px-4 text-sm text-slate-700">
                                      {new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-700">
                                      {new Date(record.date).toLocaleDateString("en-US", { weekday: "short" })}
                                    </td>
                                    <td className="py-3 px-4">
                                      {getStatusBadge(record.status)}
                                    </td>
                                    <td className="py-3 px-4 text-sm font-mono text-slate-700">
                                      {record.checkIn || "-"}
                                    </td>
                                    <td className="py-3 px-4 text-sm font-mono text-slate-700">
                                      {record.checkOut || "-"}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-500 max-w-[200px] truncate" title={record.remarks || ""}>
                                      {record.remarks || "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="outings">
                  <Card className="border-0 shadow-md bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Outing Request History</CardTitle>
                      <CardDescription>Your outing permission requests and their status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {outingRequests.length === 0 ? (
                        <div className="text-center py-12">
                          <DoorOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">No outing requests found</p>
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-[#0B2E4F]">
                                <tr>
                                  <th className="text-left text-white font-semibold py-3 px-4">Date</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">Request Time</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">Purpose</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">Reason</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">Return Status</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {outingRequests.map((request, index) => (
                                  <tr 
                                    key={request.id}
                                    className={cn(
                                      "border-b border-slate-200",
                                      index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                                    )}
                                  >
                                    <td className="py-3 px-4 text-sm text-slate-700">
                                      {new Date(request.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </td>
                                    <td className="py-3 px-4 text-sm font-mono text-slate-700">
                                      {request.requestTime}
                                    </td>
                                    <td className="py-3 px-4">
                                      <Badge className={request.purpose === "official" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                                        {request.purpose === "official" ? "Official" : "Personal"}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-700 max-w-[200px] truncate" title={request.reason}>
                                      {request.reason}
                                    </td>
                                    <td className="py-3 px-4">
                                      {request.willReturn ? (
                                        request.actualReturnTime ? (
                                          <span className="text-sm text-green-600">Returned at {request.actualReturnTime}</span>
                                        ) : (
                                          <span className="text-sm text-yellow-600">Expected: {request.expectedReturnTime}</span>
                                        )
                                      ) : (
                                        <span className="text-sm text-slate-400">No return</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4">
                                      {getOutingStatusBadge(request.status)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>

        {/* Logout Confirmation Dialog */}
        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-red-600" />
                Confirm Logout
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to logout? You will need to login again to access your account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={executeLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Outing Request Dialog */}
        <Dialog open={requestDialogOpen} onOpenChange={(open) => {
          setRequestDialogOpen(open)
          if (!open) setOutingError("")
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DoorOpen className="h-5 w-5" />
                Request Outing Permission
              </DialogTitle>
              <DialogDescription>
                Submit a request to go out during working hours. This will be sent to HR for approval.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Select value={purpose} onValueChange={(v: "official" | "personal") => setPurpose(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="official">Official Work</SelectItem>
                    <SelectItem value="personal">Personal Work</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason / Details</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe the reason for going out..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">Will you return to office?</Label>
                  <p className="text-sm text-slate-500">
                    {willReturn ? "Yes, I will return today" : "No, I will not return today"}
                  </p>
                </div>
                <Switch
                  checked={willReturn}
                  onCheckedChange={setWillReturn}
                />
              </div>

              {willReturn && (
                <div className="space-y-2">
                  <Label>Expected Return Time</Label>
                  <Input
                    type="time"
                    value={expectedReturnTime}
                    onChange={(e) => {
                      setExpectedReturnTime(e.target.value)
                      setOutingError("")
                    }}
                    min={getMinReturnTime()}
                  />
                  <p className="text-xs text-slate-500">
                    Must be at least 15 minutes from now (minimum: {getMinReturnTime()})
                  </p>
                </div>
              )}

              {outingError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  {outingError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitOutingRequest}
                disabled={!reason || (willReturn && !expectedReturnTime)}
                className="bg-[#0B2E4F] hover:bg-[#1a456b]"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}