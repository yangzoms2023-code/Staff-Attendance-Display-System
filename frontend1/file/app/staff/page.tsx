"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { dataStore } from "@/lib/data-store"
import type { Employee, AttendanceRecord, OutingRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Switch } from "@/components/ui/switch"
import {
  Building2,
  LogIn,
  LogOut,
  Clock,
  CalendarDays,
  DoorOpen,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  User,
  History,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function StaffDashboard() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [outingRequests, setOutingRequests] = useState<OutingRequest[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Outing request form state
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [purpose, setPurpose] = useState<"official" | "personal">("official")
  const [reason, setReason] = useState("")
  const [willReturn, setWillReturn] = useState(true)
  const [expectedReturnTime, setExpectedReturnTime] = useState("")

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    dataStore.init()
    const emps = dataStore.getEmployees().filter(e => e.status === "Active")
    setEmployees(emps)

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeData()
    }
  }, [selectedEmployee])

  const loadEmployeeData = () => {
    if (!selectedEmployee) return
    
    const todayAttendance = dataStore.getAttendanceByDate(today)
    const empAttendance = todayAttendance.find(a => a.employeeId === selectedEmployee.id)
    setAttendance(empAttendance || null)

    // Get last 30 days attendance
    const history: AttendanceRecord[] = []
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const records = dataStore.getAttendanceByDate(dateStr)
      const record = records.find(r => r.employeeId === selectedEmployee.id)
      if (record) {
        history.push(record)
      }
    }
    setAttendanceHistory(history)

    // Get outing requests
    const empOutings = dataStore.getOutingRequestsByEmployee(selectedEmployee.id)
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const getCurrentTime24 = () => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  }

  const handleCheckIn = () => {
    if (!selectedEmployee) return
    const time = getCurrentTime24()
    const isLate = time > "09:00"
    
    dataStore.markAttendance(selectedEmployee.id, today, {
      status: isLate ? "Late" : "Present",
      checkIn: time,
      remarks: isLate ? "Checked in late" : ""
    })
    loadEmployeeData()
  }

  const handleCheckOut = () => {
    if (!selectedEmployee || !attendance) return
    const time = getCurrentTime24()
    
    dataStore.updateAttendance(attendance.id, {
      checkOut: time,
      remarks: attendance.remarks ? `${attendance.remarks}; Checked out at ${time}` : `Checked out at ${time}`
    })
    loadEmployeeData()
  }

  const handleSubmitOutingRequest = () => {
    if (!selectedEmployee || !reason) return

    dataStore.createOutingRequest({
      employeeId: selectedEmployee.id,
      date: today,
      requestTime: getCurrentTime24(),
      purpose,
      reason,
      willReturn,
      expectedReturnTime: willReturn ? expectedReturnTime : null
    })

    // Reset form
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

  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "Present":
        return <Badge className="bg-success text-success-foreground">Present</Badge>
      case "Late":
        return <Badge className="bg-warning text-warning-foreground">Late</Badge>
      case "Absent":
        return <Badge className="bg-destructive text-destructive-foreground">Absent</Badge>
      case "Leave":
        return <Badge className="bg-primary text-primary-foreground">On Leave</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getOutingStatusBadge = (status: OutingRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Pending</Badge>
      case "approved":
        return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>
      case "denied":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Denied</Badge>
    }
  }

  // Check if currently out (has approved outing request without return)
  const currentOuting = outingRequests.find(
    r => r.date === today && r.status === "approved" && !r.actualReturnTime
  )

  // Check if has pending request today
  const pendingOuting = outingRequests.find(
    r => r.date === today && r.status === "pending"
  )

  // Employee Selection Screen
  if (!selectedEmployee) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-xl bg-primary">
              <Building2 className="h-12 w-12 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Staff Portal</h1>
            <p className="text-muted-foreground">Thimphu Dzongkhag Administration</p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Your Profile
              </CardTitle>
              <CardDescription>
                Choose your name to access your attendance dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {employees.map(emp => (
                  <Button
                    key={emp.id}
                    variant="outline"
                    className="h-auto flex-col items-start gap-1 p-4 text-left"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="font-medium">{emp.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-10">{emp.designation}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Staff Dashboard
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Staff Portal</h1>
              <p className="text-sm text-muted-foreground">Thimphu Dzongkhag Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-foreground">{formatTime(currentTime)}</p>
              <p className="text-sm text-muted-foreground">{formatDate(currentTime)}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
              <LogOut className="h-4 w-4 mr-2" />
              Switch User
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {/* Welcome Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedEmployee.name}</h2>
                  <p className="text-muted-foreground">{selectedEmployee.designation} - {selectedEmployee.department}</p>
                  <p className="text-sm text-muted-foreground">ID: {selectedEmployee.employeeId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {attendance?.status && getStatusBadge(attendance.status)}
                {currentOuting && (
                  <Badge className="bg-accent text-accent-foreground">Currently Out</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Check In */}
          <Card className={cn(
            "transition-all",
            attendance?.checkIn ? "opacity-60" : "border-success/50 bg-success/5"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                    <LogIn className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold">Check In</p>
                    <p className="text-sm text-muted-foreground">
                      {attendance?.checkIn || "Not checked in"}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  disabled={!!attendance?.checkIn}
                  onClick={handleCheckIn}
                  className="bg-success hover:bg-success/90"
                >
                  {attendance?.checkIn ? "Done" : "Check In"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Check Out */}
          <Card className={cn(
            "transition-all",
            !attendance?.checkIn || attendance?.checkOut ? "opacity-60" : "border-destructive/50 bg-destructive/5"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20">
                    <LogOut className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold">Check Out</p>
                    <p className="text-sm text-muted-foreground">
                      {attendance?.checkOut || "Not checked out"}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="destructive"
                  disabled={!attendance?.checkIn || !!attendance?.checkOut}
                  onClick={handleCheckOut}
                >
                  {attendance?.checkOut ? "Done" : "Check Out"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Request Outing */}
          <Card className={cn(
            "transition-all",
            !attendance?.checkIn || !!currentOuting || !!pendingOuting ? "opacity-60" : "border-accent/50 bg-accent/5"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                    <DoorOpen className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">Outing Request</p>
                    <p className="text-sm text-muted-foreground">
                      {currentOuting ? "Currently out" : pendingOuting ? "Pending approval" : "Request to go out"}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  disabled={!attendance?.checkIn || !!currentOuting || !!pendingOuting}
                  onClick={() => setRequestDialogOpen(true)}
                >
                  Request
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mark Return */}
          <Card className={cn(
            "transition-all",
            !currentOuting ? "opacity-60" : "border-primary/50 bg-primary/5"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Mark Return</p>
                    <p className="text-sm text-muted-foreground">
                      {currentOuting ? "Back to office" : "Not currently out"}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  disabled={!currentOuting}
                  onClick={() => currentOuting && handleMarkReturn(currentOuting.id)}
                >
                  Return
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for History */}
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="attendance" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Attendance History
            </TabsTrigger>
            <TabsTrigger value="outings" className="gap-2">
              <History className="h-4 w-4" />
              Outing Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
                <CardDescription>Your attendance records for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No attendance records found</p>
                ) : (
                  <div className="space-y-2">
                    {attendanceHistory.map(record => (
                      <div 
                        key={record.id} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[80px]">
                            <p className="text-sm font-medium">
                              {new Date(record.date).toLocaleDateString("en-US", { weekday: "short" })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          {getStatusBadge(record.status)}
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground">In</p>
                            <p className="font-medium">{record.checkIn || "-"}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Out</p>
                            <p className="font-medium">{record.checkOut || "-"}</p>
                          </div>
                          {record.remarks && (
                            <p className="text-muted-foreground max-w-[200px] truncate" title={record.remarks}>
                              {record.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outings">
            <Card>
              <CardHeader>
                <CardTitle>Outing Request History</CardTitle>
                <CardDescription>Your outing permission requests and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {outingRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No outing requests found</p>
                ) : (
                  <div className="space-y-3">
                    {outingRequests.map(request => (
                      <div 
                        key={request.id} 
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {new Date(request.date).toLocaleDateString("en-US", { 
                                  weekday: "long", 
                                  month: "short", 
                                  day: "numeric" 
                                })}
                              </p>
                              <Badge variant="outline">
                                {request.purpose === "official" ? "Official" : "Personal"}
                              </Badge>
                              {getOutingStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{request.reason}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Requested: {request.requestTime}</span>
                              {request.willReturn && (
                                <span>Expected Return: {request.expectedReturnTime}</span>
                              )}
                              {request.actualReturnTime && (
                                <span className="text-success">Returned: {request.actualReturnTime}</span>
                              )}
                            </div>
                          </div>
                          {request.status === "approved" && !request.actualReturnTime && request.date === today && (
                            <Button size="sm" onClick={() => handleMarkReturn(request.id)}>
                              Mark Return
                            </Button>
                          )}
                        </div>
                        {request.reviewerRemarks && (
                          <div className="mt-2 p-2 rounded bg-muted/50 text-sm">
                            <span className="text-muted-foreground">HR Remarks: </span>
                            {request.reviewerRemarks}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

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
                <p className="text-sm text-muted-foreground">
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
