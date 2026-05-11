"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { dataStore } from "@/lib/data-store"
import type { Employee, OutingRequest, LeaveRequest } from "@/lib/types"
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
import { CalendarDays, DoorOpen, Send, History, User, ChevronDown, Menu, LayoutDashboard, User2, AlertCircle, CalendarX, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  { title: "Dashboard", url: "/staff", icon: LayoutDashboard },
  { title: "My Profile", url: "/staff/profile", icon: User },
]

export default function StaffDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [outingRequests, setOutingRequests] = useState<OutingRequest[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  // Outing request form state
  const [outingDialogOpen, setOutingDialogOpen] = useState(false)
  const [outingPurpose, setOutingPurpose] = useState<"official" | "personal">("official")
  const [outingReason, setOutingReason] = useState("")
  const [outingWillReturn, setOutingWillReturn] = useState(true)
  const [outingExpectedReturnTime, setOutingExpectedReturnTime] = useState("")
  const [outingError, setOutingError] = useState("")

  // Leave request form state
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leaveStartDate, setLeaveStartDate] = useState("")
  const [leaveEndDate, setLeaveEndDate] = useState("")
  const [leaveReason, setLeaveReason] = useState("")
  const [leaveError, setLeaveError] = useState("")

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

    const empOutings = dataStore.getOutingRequestsByEmployee(employee.id)
    setOutingRequests(empOutings.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))

    const leaves = dataStore.getLeaveRequests().filter(l => l.employeeId === employee.id)
    setLeaveRequests(leaves.sort((a, b) =>
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

  const getMinReturnTime = (): string => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 15)
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  }

  const parseTime = (timeStr: string): number => {
    let hours = 0, minutes = 0
    const str = timeStr.trim().toUpperCase()
    const hasAmPm = str.includes("AM") || str.includes("PM")
    const isPm = str.includes("PM")
    const timePart = str.replace(/(AM|PM)/i, "").trim()
    const parts = timePart.split(":")
    if (parts.length >= 2) {
      hours = parseInt(parts[0], 10)
      minutes = parseInt(parts[1], 10)
      if (hasAmPm) {
        if (isPm && hours !== 12) hours += 12
        if (!isPm && hours === 12) hours = 0
      }
    } else if (parts.length === 1) {
      hours = parseInt(parts[0], 10)
      minutes = 0
      if (hasAmPm) {
        if (isPm && hours !== 12) hours += 12
        if (!isPm && hours === 12) hours = 0
      }
    }
    return hours * 60 + minutes
  }

  const isTimeAfter = (time1: string, time2: string): boolean => {
    return parseTime(time1) > parseTime(time2)
  }

  const handleSubmitOutingRequest = () => {
    if (!employee) return

    // Block if on leave
    if (isOnLeaveToday()) {
      setOutingError("You cannot request an outing while on leave.")
      return
    }

    if (!outingReason.trim()) {
      setOutingError("Please provide a reason for the outing")
      return
    }

    if (outingWillReturn) {
      if (!outingExpectedReturnTime.trim()) {
        setOutingError("Please specify expected return time")
        return
      }
      const minReturnTime = getMinReturnTime()
      if (!isTimeAfter(outingExpectedReturnTime, minReturnTime)) {
        setOutingError(`Expected return time must be at least 15 minutes from now (minimum: ${minReturnTime})`)
        return
      }
    }

    let finalReturnTime: string | null = null
    if (outingWillReturn && outingExpectedReturnTime) {
      const match = outingExpectedReturnTime.match(/(\d{1,2}):(\d{2})/)
      if (match) {
        let hours = parseInt(match[1], 10)
        const minutes = match[2]
        if (outingExpectedReturnTime.toUpperCase().includes("PM") && hours !== 12) hours += 12
        if (outingExpectedReturnTime.toUpperCase().includes("AM") && hours === 12) hours = 0
        finalReturnTime = `${String(hours).padStart(2, "0")}:${minutes}`
      } else {
        finalReturnTime = outingExpectedReturnTime
      }
    }

    dataStore.createOutingRequest({
      employeeId: employee.id,
      date: today,
      requestTime: getCurrentTime24(),
      purpose: outingPurpose,
      reason: outingReason,
      willReturn: outingWillReturn,
      expectedReturnTime: finalReturnTime
    })

    setOutingPurpose("official")
    setOutingReason("")
    setOutingWillReturn(true)
    setOutingExpectedReturnTime("")
    setOutingError("")
    setOutingDialogOpen(false)
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

  const handleSubmitLeaveRequest = () => {
    if (!employee) return

    const start = leaveStartDate.trim()
    const end = leaveEndDate.trim()
    const reason = leaveReason.trim()

    if (!start || !end || !reason) {
      setLeaveError("Please fill all fields")
      return
    }

    if (start > end) {
      setLeaveError("Start date cannot be after end date")
      return
    }

    if (start < today) {
      setLeaveError("Leave cannot start in the past")
      return
    }

    dataStore.createLeaveRequest({
      employeeId: employee.id,
      startDate: start,
      endDate: end,
      reason: reason
    })

    setLeaveStartDate("")
    setLeaveEndDate("")
    setLeaveReason("")
    setLeaveError("")
    setLeaveDialogOpen(false)
    loadEmployeeData()
  }

  const handleLogout = () => {
    localStorage.removeItem("tda_current_user")
    logout()
    router.push("/")
  }

  const currentOuting = outingRequests.find(
    r => r.date === today && r.status === "approved" && !r.actualReturnTime
  )

  const isOnLeaveToday = () => {
    const todayStr = today
    return leaveRequests.some(leave =>
      leave.startDate <= todayStr && leave.endDate >= todayStr
    )
  }

  const canRequestOuting = !currentOuting && !isOnLeaveToday()
  const canMarkReturn = !!currentOuting

  const getOutingStatusBadge = (status: OutingRequest["status"]) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

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
        <div
          className="fixed inset-0 bg-repeat opacity-10 -z-10"
          style={{ backgroundImage: "url('/images/bg-pattern.png')" }}
        />

        <div className="relative z-10">
          {/* Header */}
          <header className="flex items-center justify-between bg-white shadow-sm px-6 md:px-10 py-3 border-b border-slate-200 sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center">
                <Image src="/icon.png" alt="Logo" width={48} height={48} className="object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">Staff Portal</h1>
                <p className="text-xs text-slate-500">Thimphu Dzongkhag Administration</p>
              </div>
            </div>

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
                    className="gap-2 cursor-pointer hover:!bg-[#0B2E4F] hover:text-white"
                    onClick={() => router.push("/staff/profile")}
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer hover:!bg-[#0B2E4F] hover:text-white"
                    onClick={() => setLogoutDialogOpen(true)}
                  >
                    <User2 className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden hover:bg-[#0B2E4F] hover:text-white"
                >
                  <Menu className="h-5 w-5 text-slate-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
                <div className="flex flex-col h-full bg-white">
                  <div className="border-b border-slate-200 p-4">
                    <Link href="/staff" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                        <Image src="/icon.png" alt="Logo" width={40} height={40} className="object-contain" />
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
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-6 py-2.5 mx-2 rounded-lg transition-colors ${isActive
                            ? "bg-[#0B2E4F] text-white"
                            : "text-slate-600 hover:bg-[#0B2E4F] hover:text-white"
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
                        <p className="text-sm font-medium text-slate-800">{employee.name}</p>
                        <p className="text-xs text-slate-500 capitalize">Employee</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setLogoutDialogOpen(true)
                        setMobileMenuOpen(false)
                      }}
                    >
                      <User2 className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </header>

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
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Current Status</span>
                    {isOnLeaveToday() ? (
                      <Badge className="bg-purple-500/30 text-white border-purple-500/50">On Leave Today</Badge>
                    ) : currentOuting ? (
                      <Badge className="bg-amber-500/30 text-white border-amber-500/50">Currently Out</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/30 text-white border-emerald-500/50">In Office</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Leave Request Card */}
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarX className="h-5 w-5 text-purple-600" />
                    Request Leave
                  </CardTitle>
                  <CardDescription>Submit a leave request (auto-approved)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setLeaveDialogOpen(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Request Leave
                  </Button>
                </CardContent>
              </Card>

              {/* Outing Request Card */}
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DoorOpen className="h-5 w-5 text-blue-600" />
                    Request Outing
                  </CardTitle>
                  <CardDescription>Submit an outing request (auto-approved)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentOuting ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleMarkReturn(currentOuting.id)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Mark Return
                        </Button>
                        <Button variant="outline" className="flex-1" disabled>
                          Currently Out
                        </Button>
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full">
                            <Button
                              onClick={() => {
                                if (isOnLeaveToday()) {
                                  alert("You cannot request an outing while on leave.")
                                  return
                                }
                                setOutingDialogOpen(true)
                              }}
                              disabled={!canRequestOuting}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <DoorOpen className="h-4 w-4 mr-2" />
                              Request Outing
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!canRequestOuting && (
                          <TooltipContent>
                            {isOnLeaveToday()
                              ? "You are on leave today and cannot request an outing"
                              : "You already have an active outing today"}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* History Section */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-4">History & Records</h3>
              <Tabs defaultValue="leaves" className="space-y-4">
                <TabsList className="bg-white border">
                  <TabsTrigger value="leaves" className="gap-2 data-[state=active]:bg-[#0B2E4F] data-[state=active]:text-white">
                    <CalendarDays className="h-4 w-4" />
                    Leave History
                  </TabsTrigger>
                  <TabsTrigger value="outings" className="gap-2 data-[state=active]:bg-[#0B2E4F] data-[state=active]:text-white">
                    <History className="h-4 w-4" />
                    Outing History
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="leaves">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle>Your Leave Requests</CardTitle>
                      <CardDescription>All leave requests are automatically approved</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {leaveRequests.length === 0 ? (
                        <div className="text-center py-12">
                          <CalendarX className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">No leave requests found</p>
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-[#0B2E4F]">
                                <tr>
                                  <th className="text-left text-white font-semibold py-3 px-4">Start Date</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">End Date</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">Reason</th>
                                  <th className="text-left text-white font-semibold py-3 px-4">Requested On</th>
                                </tr>
                              </thead>
                              <tbody>
                                {leaveRequests.map((request, index) => (
                                  <tr key={request.id} className={cn("border-b border-slate-200", index % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                                    <td className="py-3 px-4 text-sm text-slate-700">{new Date(request.startDate).toLocaleDateString()}</td>
                                    <td className="py-3 px-4 text-sm text-slate-700">{new Date(request.endDate).toLocaleDateString()}</td>
                                    <td className="py-3 px-4 text-sm text-slate-700">{request.reason}</td>
                                    <td className="py-3 px-4 text-sm text-slate-500">{new Date(request.createdAt).toLocaleDateString()}</td>
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
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle>Your Outing Requests</CardTitle>
                      <CardDescription>All outing requests are automatically approved</CardDescription>
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
                                </tr>
                              </thead>
                              <tbody>
                                {outingRequests.map((request, index) => (
                                  <tr key={request.id} className={cn("border-b border-slate-200", index % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                                    <td className="py-3 px-4 text-sm text-slate-700">{new Date(request.date).toLocaleDateString()}</td>
                                    <td className="py-3 px-4 text-sm font-mono text-slate-700">{request.requestTime}</td>
                                    <td className="py-3 px-4">
                                      <Badge className={request.purpose === "official" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                                        {request.purpose === "official" ? "Official" : "Personal"}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-700">{request.reason}</td>
                                    <td className="py-3 px-4">
                                      {request.actualReturnTime ? (
                                        <span className="text-sm text-green-600">Returned at {request.actualReturnTime}</span>
                                      ) : request.willReturn ? (
                                        <span className="text-sm text-yellow-600">Expected: {request.expectedReturnTime}</span>
                                      ) : (
                                        <span className="text-sm text-slate-400">No return</span>
                                      )}
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

        {/* Dialogs */}
        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogDescription>Are you sure you want to logout?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleLogout}>Logout</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={outingDialogOpen} onOpenChange={setOutingDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Outing Permission</DialogTitle>
              <DialogDescription>Your request will be automatically approved</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Select value={outingPurpose} onValueChange={(v: "official" | "personal") => setOutingPurpose(v)}>
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
                  value={outingReason}
                  onChange={(e) => setOutingReason(e.target.value)}
                  placeholder="Please describe the reason for going out..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">Will you return to office?</Label>
                  <p className="text-sm text-slate-500">
                    {outingWillReturn ? "Yes, I will return today" : "No, I will not return today"}
                  </p>
                </div>
                <Switch checked={outingWillReturn} onCheckedChange={setOutingWillReturn} />
              </div>

              {outingWillReturn && (
                <div className="space-y-2">
                  <Label>Expected Return Time</Label>
                  <Input
                    type="time"
                    value={outingExpectedReturnTime}
                    onChange={(e) => setOutingExpectedReturnTime(e.target.value)}
                    min={getMinReturnTime()}
                  />
                  <p className="text-xs text-slate-500">Must be at least 15 minutes from now (24‑hour format)</p>
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
              <Button variant="outline" onClick={() => setOutingDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitOutingRequest} className="bg-[#0B2E4F] hover:bg-[#1a456b]">
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
              <DialogDescription>Leave requests are automatically approved</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  min={today}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  min={leaveStartDate || today}
                />
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Please provide reason for leave..."
                  rows={3}
                />
              </div>

              {leaveError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  {leaveError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitLeaveRequest} className="bg-purple-600 hover:bg-purple-700">
                <Send className="h-4 w-4 mr-2" />
                Submit Leave
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}