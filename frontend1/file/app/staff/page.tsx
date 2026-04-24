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
import { LogIn, LogOut, Clock, CalendarDays, DoorOpen, Send, CheckCircle, History, User, ChevronDown, Menu, LayoutDashboard, Monitor, User2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

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

  const today = new Date().toISOString().split("T")[0]

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
    const isLate = time > "09:00"
    
    const newRecord: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt"> = {
      employeeId: employee.id,
      date: today,
      checkIn: time,
      checkOut: null,
      status: isLate ? "Late" : "Present",
      remarks: isLate ? "Checked in late" : ""
    }
    
    dataStore.markAttendance(newRecord)
    loadEmployeeData()
  }

  const handleCheckOut = () => {
    if (!employee || !attendance) return
    const time = getCurrentTime24()
    
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
    if (!employee || !reason) return

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
    setRequestDialogOpen(false)
    loadEmployeeData()
  }

  const handleMarkReturn = (requestId: string) => {
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

  const currentOuting = outingRequests.find(
    r => r.date === today && r.status === "approved" && !r.actualReturnTime
  )

  const pendingOuting = outingRequests.find(
    r => r.date === today && r.status === "pending"
  )

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading employee data...</div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background Pattern */}
      <div 
        className="fixed inset-0 bg-repeat opacity-10 -z-10"
        style={{ backgroundImage: "url('/images/bg-pattern.png')" }}
      />
      
      <div className="relative z-10">
        {/* Header - White background */}
        <header className="flex items-center justify-between bg-white shadow-sm px-4 sm:px-6 md:px-10 py-3 border-b border-slate-200 sticky top-0 z-50">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center">
              <Image src="/icon.png" alt="Logo" width={48} height={48} className="object-contain w-full h-full"/>
            </div>
            <div className="hidden xs:block">
              <h1 className="text-base sm:text-lg font-semibold text-[#0B2E4F]">Staff Portal</h1>
              <p className="text-[10px] sm:text-xs font-medium text-[#0B2E4F]">Thimphu Dzongkhag Administration</p>
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
                  <span className="font-medium text-slate-700 hidden sm:inline">{employee.name.split(' ')[0]}</span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-3 border-b">
                  <p className="font-semibold text-slate-900">{employee.name}</p>
                  <p className="text-sm text-slate-500">{employee.designation}</p>
                  <p className="text-xs text-slate-400 mt-1 truncate">{employee.email}</p>
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
                      <span className="text-sm font-semibold text-[#0B2E4F]">Thimphu Dzongkhag</span>
                      <span className="text-xs text-[#0B2E4F]">Attendance System</span>
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
                  <div className="px-3 mt-4 mb-2">
                    <p className="text-xs font-semibold text-slate-400 px-3 py-2">Quick Access</p>
                  </div>
                  <Link
                    href="/tv"
                    target="_blank"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-6 py-2.5 mx-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <Monitor className="h-4 w-4" />
                    <span className="text-sm">TV Display</span>
                  </Link>
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
        <main className="px-4 sm:px-6 md:px-10 lg:px-14 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
          
          {/* Welcome Banner - Fully Responsive */}
          <div className="bg-gradient-to-r from-[#0B2E4F] to-[#1a456b] rounded-lg p-4 sm:p-5 md:p-7 mb-6 sm:mb-8 text-white shadow-xl">
            {/* Mobile Layout (xs to sm) */}
            <div className="block sm:hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white text-xl font-bold shadow-lg shrink-0">
                  {employee.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold truncate">Welcome back, {employee.name.split(' ')[0]}!</h2>
                  <p className="text-white/80 text-xs truncate">{employee.designation}</p>
                  <p className="text-white/60 text-[10px] truncate">ID: {employee.employeeId}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] uppercase font-bold text-white/60 tracking-widest">Status</span>
                  {attendance?.status && getStatusBadge(attendance.status)}
                </div>
                {currentOuting && (
                  <Badge className="bg-purple-500/30 text-white border-purple-500/50 text-[10px] px-2 py-0.5">
                    Out
                  </Badge>
                )}
              </div>
            </div>

            {/* Tablet Layout (sm to md) */}
            <div className="hidden sm:block md:hidden">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white text-2xl font-bold shadow-lg shrink-0">
                    {employee.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold truncate">Welcome back, {employee.name.split(' ')[0]}!</h2>
                    <p className="text-white/80 text-sm truncate">{employee.designation} • {employee.department}</p>
                    <p className="text-white/60 text-xs truncate">ID: {employee.employeeId}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Status</span>
                    {attendance?.status && getStatusBadge(attendance.status)}
                  </div>
                  {currentOuting && (
                    <Badge className="bg-purple-500/30 text-white border-purple-500/50 text-xs px-2 py-0.5">
                      Currently Out
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Layout (md and above) */}
            <div className="hidden md:flex md:items-center md:justify-between md:gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-white text-3xl font-bold shadow-lg">
                  {employee.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Welcome back, {employee.name.split(' ')[0]}!</h2>
                  <p className="text-white/80 text-lg mt-1">{employee.designation} • {employee.department}</p>
                  <p className="text-white/60 text-sm mt-1">ID: {employee.employeeId}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Current Status</span>
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
          
          {/* Quick Actions Grid */}
          <div className="mb-8 sm:mb-10">
            <h3 className="text-base font-semibold text-slate-900 mb-3 sm:mb-4">Quick Actions</h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
              {/* Check In */}
              <Card className={cn(
                "border-none transition-all shadow-sm",
                attendance?.checkIn ? "bg-slate-50/50" : "bg-white ring-1 ring-emerald-100 shadow-emerald-100/50"
              )}>
                <CardContent className="p-2 sm:p-3">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center",
                        attendance?.checkIn ? "bg-slate-200 text-slate-500" : "bg-emerald-500 text-white shadow-md"
                      )}>
                        <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight">Clock In</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-none">{attendance?.checkIn || "Ready"}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleCheckIn} disabled={!!attendance?.checkIn}
                      className={cn("h-7 sm:h-8 px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm transition-all", 
                        attendance?.checkIn ? "bg-slate-200 text-slate-400" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      )}>
                      {attendance?.checkIn ? "Done" : "In"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Check Out */}
              <Card className={cn(
                "border-none transition-all shadow-sm",
                !attendance?.checkIn || attendance?.checkOut ? "bg-slate-50/50" : "bg-white ring-1 ring-rose-100 shadow-rose-100/50"
              )}>
                <CardContent className="p-2 sm:p-3">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center",
                        !attendance?.checkIn || attendance?.checkOut ? "bg-slate-200 text-slate-500" : "bg-rose-500 text-white shadow-md"
                      )}>
                        <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight">Clock Out</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-none">{attendance?.checkOut || "Not Yet"}</p>
                      </div>
                    </div>
                    <Button size="sm" variant={!attendance?.checkIn || attendance?.checkOut ? "secondary" : "destructive"}
                      onClick={handleCheckOut} disabled={!attendance?.checkIn || !!attendance?.checkOut} 
                      className="h-7 sm:h-8 px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm">
                      Out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Outing Request */}
              <Card className={cn(
                "border-none transition-all shadow-sm",
                !attendance?.checkIn || !!currentOuting || !!pendingOuting ? "bg-slate-50/50" : "bg-white ring-1 ring-blue-100 shadow-blue-100/50"
              )}>
                <CardContent className="p-2 sm:p-3">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center",
                        !attendance?.checkIn || !!currentOuting || !!pendingOuting ? "bg-slate-200 text-slate-500" : "bg-blue-500 text-white shadow-md"
                      )}>
                        <DoorOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight">Outing</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-none">{pendingOuting ? "Wait" : currentOuting ? "Away" : "None"}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => setRequestDialogOpen(true)} disabled={!attendance?.checkIn || !!currentOuting || !!pendingOuting}
                      className={cn("h-7 sm:h-8 px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm", currentOuting || pendingOuting ? "bg-slate-200 text-slate-400" : "bg-blue-600 hover:bg-blue-700 text-white")}>
                      Go
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Mark Return */}
              <Card className={cn(
                "border-none transition-all shadow-sm",
                !currentOuting ? "bg-slate-50/50" : "bg-white ring-1 ring-indigo-100 shadow-indigo-100/50"
              )}>
                <CardContent className="p-2 sm:p-3">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center",
                        !currentOuting ? "bg-slate-200 text-slate-500" : "bg-indigo-600 text-white shadow-md"
                      )}>
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight">Return</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-none">{currentOuting ? "Check In" : "Ready"}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => currentOuting && handleMarkReturn(currentOuting.id)} disabled={!currentOuting}
                      className={cn("h-7 sm:h-8 px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm", !currentOuting ? "bg-slate-200 text-slate-400" : "bg-indigo-700 text-white")}>
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* History Section */}
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-3 sm:mb-4">History & Records</h3>
            
            <Tabs defaultValue="attendance" className="space-y-4">
              <TabsList className="bg-white border flex flex-wrap h-auto p-1">
                <TabsTrigger 
                  value="attendance" 
                  className="gap-1 sm:gap-2 data-[state=active]:bg-[#0B2E4F] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-700 hover:data-[state=inactive]:bg-slate-50 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                >
                  <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Attendance History</span>
                  <span className="xs:hidden">Attendance</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="outings" 
                  className="gap-1 sm:gap-2 data-[state=active]:bg-[#0B2E4F] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-700 hover:data-[state=inactive]:bg-slate-50 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                >
                  <History className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Outing Requests</span>
                  <span className="xs:hidden">Outings</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="attendance">
                <Card className="border-0 shadow-md bg-white/95 backdrop-blur-sm">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Recent Attendance</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Your attendance records for the last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    {attendanceHistory.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center text-slate-400 border border-slate-200 rounded-lg">
                        <CalendarDays className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm font-medium">No attendance records found</p>
                        <p className="text-xs">Start by checking in today</p>
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <div className="min-w-[500px]">
                          <div className="grid grid-cols-6 gap-0 border-b border-slate-200 bg-[#0B2E4F] rounded-t-lg text-white text-xs font-semibold uppercase tracking-wider">
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Date</div>
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Day</div>
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Status</div>
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Check In</div>
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Check Out</div>
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Remarks</div>
                          </div>
                          {attendanceHistory.map((record, index) => (
                            <div
                              key={record.id}
                              className={cn(
                                "grid grid-cols-6 gap-0 items-center border-l border-r border-b border-slate-200",
                                index % 2 === 0 ? "bg-[#FDFDFD]" : "bg-[#F6F6F6]",
                                index === attendanceHistory.length - 1 && "rounded-b-lg"
                              )}
                            >
                              <div className="py-2 sm:py-3 px-1 sm:px-3 text-[11px] sm:text-sm text-slate-700 text-center truncate">
                                {new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                              <div className="py-2 sm:py-3 px-1 sm:px-3 text-[11px] sm:text-sm text-slate-700 text-center">
                                {new Date(record.date).toLocaleDateString("en-US", { weekday: "short" })}
                              </div>
                              <div className="py-2 sm:py-3 px-1 sm:px-3 flex justify-center">
                                {getStatusBadge(record.status)}
                              </div>
                              <div className="py-2 sm:py-3 px-1 sm:px-3 text-[11px] sm:text-sm font-mono text-slate-700 text-center">
                                {record.checkIn || "-"}
                              </div>
                              <div className="py-2 sm:py-3 px-1 sm:px-3 text-[11px] sm:text-sm font-mono text-slate-700 text-center">
                                {record.checkOut || "-"}
                              </div>
                              <div className="py-2 sm:py-3 px-1 sm:px-3 text-[11px] sm:text-sm text-slate-500 truncate text-center" title={record.remarks || ""}>
                                {record.remarks || "-"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="outings">
                <Card className="border-0 shadow-md bg-white/95 backdrop-blur-sm">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Outing Request History</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Your outing permission requests and their status</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    {outingRequests.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center text-slate-400 border border-slate-200 rounded-lg">
                        <DoorOpen className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm font-medium">No outing requests found</p>
                        <p className="text-xs">Submit your first outing request</p>
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <div className="min-w-[800px]">
                          <div className="grid grid-cols-7 gap-0 border-b border-slate-200 bg-[#0B2E4F] rounded-t-lg text-white text-xs font-semibold uppercase tracking-wider">
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Date</div>
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Req Time</div>
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Purpose</div>
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Reason</div>
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Return Status</div>
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Status</div>
                            <div className="py-2 sm:py-3 px-2 sm:px-3 text-center">Action</div>
                          </div>
                          {outingRequests.map((request, index) => (
                            <div
                              key={request.id}
                              className={cn(
                                "grid grid-cols-7 gap-0 items-center border-l border-r border-b border-slate-200",
                                index % 2 === 0 ? "bg-[#FDFDFD]" : "bg-[#F6F6F6]",
                                index === outingRequests.length - 1 && "rounded-b-lg"
                              )}
                            >
                              <div className="py-2 sm:py-3 px-1 sm:px-3 text-[11px] sm:text-sm text-slate-700 text-center">
                                {new Date(request.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                              <div className="py-2 sm:py-3 px-1 sm:px-3 text-[11px] sm:text-sm font-mono text-slate-700 text-center">
                                {request.requestTime}
                              </div>
                              <div className="py-2 sm:py-3 px-1 sm:px-3 flex justify-center">
                                <Badge className={request.purpose === "official" ? "bg-blue-100 text-blue-800 text-[10px] sm:text-xs" : "bg-purple-100 text-purple-800 text-[10px] sm:text-xs"}>
                                  {request.purpose === "official" ? "Official" : "Personal"}
                                </Badge>
                              </div>
                              <div className="py-2 sm:py-3 px-1 sm:px-3 text-[11px] sm:text-sm text-slate-700 truncate text-center" title={request.reason}>
                                {request.reason.length > 15 ? request.reason.substring(0, 15) + "..." : request.reason}
                              </div>
                              <div className="py-2 sm:py-3 px-1 sm:px-3 text-center">
                                {request.willReturn ? (
                                  request.actualReturnTime ? (
                                    <span className="text-[10px] sm:text-xs text-green-600 flex items-center justify-center gap-1">
                                      <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3" />
                                      Returned
                                    </span>
                                  ) : (
                                    <span className="text-[10px] sm:text-xs text-yellow-600">Expected: {request.expectedReturnTime}</span>
                                  )
                                ) : (
                                  <span className="text-[10px] sm:text-xs text-slate-400">No return</span>
                                )}
                              </div>
                              <div className="py-2 sm:py-3 px-1 sm:px-3 flex justify-center">
                                {getOutingStatusBadge(request.status)}
                              </div>
                              <div className="py-2 sm:py-3 px-1 sm:px-3 flex justify-center">
                                {request.status === "approved" && !request.actualReturnTime && request.date === today && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-6 sm:h-7 text-[10px] sm:text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 px-2 sm:px-3"
                                    onClick={() => handleMarkReturn(request.id)}
                                  >
                                    <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                    Return
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
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
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
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
                  onChange={(e) => setExpectedReturnTime(e.target.value)}
                />
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
  )
}