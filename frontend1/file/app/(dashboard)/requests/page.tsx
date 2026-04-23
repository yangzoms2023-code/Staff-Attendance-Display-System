"use client"

import { useEffect, useState } from "react"
import { dataStore } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import type { OutingRequest, Employee } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Check,
  X,
  Clock,
  Briefcase,
  User,
  ArrowLeftRight,
  RefreshCw,
  Filter,
  Calendar,
} from "lucide-react"

export default function RequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<OutingRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<OutingRequest | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewRemarks, setReviewRemarks] = useState("")
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0])
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setLoading(true)
    dataStore.init()
    setRequests(dataStore.getOutingRequests())
    setEmployees(dataStore.getEmployees())
    setLoading(false)
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId)
    return employee?.name || "Unknown"
  }

  const getEmployeeInfo = (employeeId: string) => {
    return employees.find(e => e.id === employeeId)
  }

  const handleApprove = (request: OutingRequest) => {
    setSelectedRequest(request)
    setReviewRemarks("")
    setReviewDialogOpen(true)
  }

  const handleDeny = (request: OutingRequest) => {
    setSelectedRequest(request)
    setReviewRemarks("")
    setReviewDialogOpen(true)
  }

  const submitReview = (decision: "approved" | "denied") => {
    if (!selectedRequest || !user) return

    dataStore.reviewOutingRequest(
      selectedRequest.id,
      decision,
      user.id,
      reviewRemarks
    )
    loadData()
    setReviewDialogOpen(false)
    setSelectedRequest(null)
  }

  const handleMarkReturn = (requestId: string) => {
    dataStore.markOutingReturn(requestId)
    loadData()
  }

  const filteredRequests = requests.filter(r => {
    const dateMatch = r.date === filterDate
    const statusMatch = filterStatus === "all" || r.status === filterStatus
    return dateMatch && statusMatch
  })

  const pendingRequests = requests.filter(r => r.status === "pending")
  const todayRequests = requests.filter(r => r.date === new Date().toISOString().split("T")[0])
  const outOnApproved = todayRequests.filter(r => r.status === "approved" && !r.actualReturnTime)

  const getStatusBadge = (status: OutingRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Pending</Badge>
      case "approved":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Approved</Badge>
      case "denied":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Denied</Badge>
    }
  }

  const getPurposeBadge = (purpose: OutingRequest["purpose"]) => {
    return purpose === "official" ? (
      <Badge variant="secondary" className="gap-1">
        <Briefcase className="h-3 w-3" />
        Official
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <User className="h-3 w-3" />
        Personal
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Outing Requests</h1>
          <p className="text-base text-slate-500">
            Review and manage staff outing requests
          </p>
        </div>
        <Button 
          onClick={loadData} 
          className="gap-2 bg-[#0B2E4F] text-white hover:bg-white hover:text-[#0B2E4F] border border-[#0B2E4F] shadow-sm h-10 px-5 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">Pending Requests</p>
                <p className="text-2xl font-bold text-slate-900">{pendingRequests.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">Today&apos;s Requests</p>
                <p className="text-2xl font-bold text-slate-900">{todayRequests.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">Currently Out</p>
                <p className="text-2xl font-bold text-amber-600">{outOnApproved.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">Approved Today</p>
                <p className="text-2xl font-bold text-emerald-600">{todayRequests.filter(r => r.status === "approved").length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Currently Out ({outOnApproved.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Filter className="h-4 w-4" />
            All Requests
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                Pending Approval
              </CardTitle>
              <CardDescription>
                Review and approve or deny staff outing requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg">No Pending Requests</h3>
                  <p className="text-muted-foreground text-sm">
                    All outing requests have been reviewed
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => {
                    const employee = getEmployeeInfo(request.employeeId)
                    return (
                      <Card key={request.id} className="border-warning/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">
                                  {employee?.name || "Unknown"}
                                </span>
                                {getPurposeBadge(request.purpose)}
                                {getStatusBadge(request.status)}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p><strong>Department:</strong> {employee?.department}</p>
                                <p><strong>Designation:</strong> {employee?.designation}</p>
                                <p><strong>Request Time:</strong> {request.requestTime}</p>
                                <p><strong>Reason:</strong> {request.reason}</p>
                                <p>
                                  <strong>Will Return:</strong>{" "}
                                  {request.willReturn ? (
                                    <span className="text-success">
                                      Yes, by {request.expectedReturnTime}
                                    </span>
                                  ) : (
                                    <span className="text-destructive">No</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-success hover:bg-success/90"
                                onClick={() => handleApprove(request)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeny(request)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Deny
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Currently Out Tab */}
        <TabsContent value="active" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                  <ArrowLeftRight className="h-4 w-4 text-orange-500" />
                </div>
                Staff Currently Out
              </CardTitle>
              <CardDescription>
                Track staff who are currently out of office and mark their return
              </CardDescription>
            </CardHeader>
            <CardContent>
              {outOnApproved.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ArrowLeftRight className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg">No Staff Out</h3>
                  <p className="text-muted-foreground text-sm">
                    All approved staff have returned to office
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {outOnApproved.map((request) => {
                    const employee = getEmployeeInfo(request.employeeId)
                    return (
                      <Card key={request.id} className="border-accent/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">
                                  {employee?.name || "Unknown"}
                                </span>
                                {getPurposeBadge(request.purpose)}
                                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                                  Out of Office
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p><strong>Left at:</strong> {request.requestTime}</p>
                                <p><strong>Purpose:</strong> {request.reason}</p>
                                {request.willReturn && (
                                  <p>
                                    <strong>Expected Return:</strong>{" "}
                                    <span className="text-warning">{request.expectedReturnTime}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            {request.willReturn && (
                              <Button
                                size="sm"
                                className="bg-success hover:bg-success/90"
                                onClick={() => handleMarkReturn(request.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Mark Returned
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Requests Tab */}
        <TabsContent value="all" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Filter className="h-4 w-4 text-blue-500" />
                </div>
                Request History
              </CardTitle>
              <CardDescription>
                View and filter all outing requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Return</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No requests found for the selected filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {getEmployeeName(request.employeeId)}
                          </TableCell>
                          <TableCell>{request.requestTime}</TableCell>
                          <TableCell>{getPurposeBadge(request.purpose)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {request.reason}
                          </TableCell>
                          <TableCell>
                            {request.willReturn ? (
                              <span className="text-sm">
                                {request.actualReturnTime ? (
                                  <span className="text-success">
                                    Returned at {request.actualReturnTime}
                                  </span>
                                ) : (
                                  <span className="text-warning">
                                    Expected: {request.expectedReturnTime}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">No</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {request.status === "pending" && (
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-success hover:text-success"
                                  onClick={() => handleApprove(request)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeny(request)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {request.status === "approved" && request.willReturn && !request.actualReturnTime && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkReturn(request.id)}
                              >
                                Mark Return
                              </Button>
                            )}
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
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Outing Request</DialogTitle>
            <DialogDescription>
              Add remarks before approving or denying this request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p><strong>Employee:</strong> {getEmployeeName(selectedRequest.employeeId)}</p>
                <p><strong>Purpose:</strong> {selectedRequest.purpose === "official" ? "Official Work" : "Personal Work"}</p>
                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
                <p>
                  <strong>Will Return:</strong>{" "}
                  {selectedRequest.willReturn 
                    ? `Yes, by ${selectedRequest.expectedReturnTime}`
                    : "No"
                  }
                </p>
              </div>
              <div className="space-y-2">
                <Label>Remarks (Optional)</Label>
                <Textarea
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Add any remarks for this decision..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => submitReview("denied")}
            >
              <X className="h-4 w-4 mr-1" />
              Deny
            </Button>
            <Button
              className="bg-success hover:bg-success/90"
              onClick={() => submitReview("approved")}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
