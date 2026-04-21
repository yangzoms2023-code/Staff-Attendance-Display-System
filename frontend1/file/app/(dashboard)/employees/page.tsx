"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { dataStore, DEPARTMENTS, DESIGNATIONS } from "@/lib/data-store"
import type { Employee } from "@/lib/types"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users, Mail, Phone, Calendar, Building2, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type EmployeeFormData = Omit<Employee, "id" | "createdAt" | "updatedAt">

const emptyFormData: EmployeeFormData = {
  employeeId: "",
  name: "",
  gender: "Male",
  designation: "",
  contactNumber: "",
  email: "",
  address: "",
  department: "",
  joiningDate: "",
  status: "Active",
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<EmployeeFormData>(emptyFormData)

  useEffect(() => {
    dataStore.init()
    loadEmployees()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [employees, searchQuery, departmentFilter, statusFilter])

  const loadEmployees = () => {
    const emps = dataStore.getEmployees()
    setEmployees(emps)
  }

  const filterEmployees = () => {
    let filtered = [...employees]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(query) ||
          emp.employeeId.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.contactNumber.includes(query)
      )
    }
    
    if (departmentFilter !== "all") {
      filtered = filtered.filter((emp) => emp.department === departmentFilter)
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((emp) => emp.status === statusFilter)
    }
    
    setFilteredEmployees(filtered)
  }

  const handleAdd = () => {
    setEditingEmployee(null)
    setFormData({
      ...emptyFormData,
      employeeId: `TDA${String(Date.now()).slice(-6)}`,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      employeeId: employee.employeeId,
      name: employee.name,
      gender: employee.gender,
      designation: employee.designation,
      contactNumber: employee.contactNumber,
      email: employee.email,
      address: employee.address,
      department: employee.department,
      joiningDate: employee.joiningDate,
      status: employee.status,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (employee: Employee) => {
    setDeletingEmployee(employee)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (deletingEmployee) {
      dataStore.deleteEmployee(deletingEmployee.id)
      loadEmployees()
      setIsDeleteDialogOpen(false)
      setDeletingEmployee(null)
    }
  }

  const handleSave = () => {
    if (editingEmployee) {
      dataStore.updateEmployee(editingEmployee.id, formData)
    } else {
      dataStore.addEmployee(formData)
    }
    loadEmployees()
    setIsDialogOpen(false)
    setEditingEmployee(null)
    setFormData(emptyFormData)
  }

  const updateFormData = (field: keyof EmployeeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-amber-100 text-amber-700",
      "bg-rose-100 text-rose-700",
      "bg-violet-100 text-violet-700",
      "bg-cyan-100 text-cyan-700",
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Employees</h1>
          <p className="text-base text-slate-500">
            Manage employee records and information
          </p>
        </div>
        <Button 
          onClick={handleAdd} 
          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-10 px-5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">Total Employees</p>
                <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">Active</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {employees.filter(e => e.status === "Active").length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <UserCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">Departments</p>
                <p className="text-2xl font-bold text-slate-900">
                  {new Set(employees.map(e => e.department)).size}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">This Month</p>
                <p className="text-2xl font-bold text-slate-900">
                  {employees.filter(e => {
                    const date = new Date(e.joiningDate)
                    const now = new Date()
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card className="border border-slate-200 shadow-none bg-white mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, ID, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 w-full"
              />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[160px] h-10 border-slate-200">
                  <Building2 className="h-4 w-4 mr-2 text-slate-500 shrink-0" />
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-10 border-slate-200">
                  <UserCircle className="h-4 w-4 mr-2 text-slate-500 shrink-0" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card className="border border-slate-200 shadow-none bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 shrink-0">
              <Users className="h-4 w-4 text-slate-700" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Employee List</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">
                Total: {filteredEmployees.length} employees
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[80px_1fr_130px_140px_120px_90px_50px] gap-0 border-b border-slate-100 bg-slate-50/30">
              <div className="py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ID
              </div>
              <div className="py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Name
              </div>
              <div className="py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Department
              </div>
              <div className="py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Designation
              </div>
              <div className="py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Contact
              </div>
              <div className="py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </div>
              <div className="py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                
              </div>
            </div>

            {/* Table Body */}
            {filteredEmployees.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-slate-400">
                <Users className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">No employees found</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredEmployees.map((employee, index) => (
                <div 
                  key={employee.id}
                  className={cn(
                    "grid grid-cols-[80px_1fr_130px_140px_120px_90px_50px] gap-0 items-center border-b border-slate-50 transition-colors hover:bg-slate-50/80",
                    index === filteredEmployees.length - 1 && "border-b-0"
                  )}
                >
                  <div className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-xs font-mono font-medium text-slate-700">
                      {employee.employeeId}
                    </span>
                  </div>
                  <div className="py-3 px-3 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shrink-0",
                        getAvatarColor(employee.name)
                      )}>
                        {getInitials(employee.name)}
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-sm font-semibold text-slate-900 truncate">{employee.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          <p className="text-xs text-slate-500 truncate">{employee.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="py-3 px-3">
                    <span className="text-sm text-slate-700 truncate block">{employee.department}</span>
                  </div>
                  <div className="py-3 px-3">
                    <span className="text-sm text-slate-700 truncate block">{employee.designation}</span>
                  </div>
                  <div className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-700 font-mono truncate">{employee.contactNumber}</span>
                    </div>
                  </div>
                  <div className="py-3 px-3">
                    <Badge
                      variant={employee.status === "Active" ? "default" : "secondary"}
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium border-0",
                        employee.status === "Active" 
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      <span className={cn(
                        "mr-1.5 h-1.5 w-1.5 rounded-full inline-block",
                        employee.status === "Active" ? "bg-emerald-500" : "bg-slate-400"
                      )} />
                      {employee.status}
                    </Badge>
                  </div>
                  <div className="py-3 px-3 text-right">
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
                        <DropdownMenuItem 
                          onClick={() => handleEdit(employee)}
                          className="gap-2 text-sm"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(employee)}
                          className="gap-2 text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-slate-200">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {editingEmployee ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {editingEmployee
                ? "Update the employee information below"
                : "Enter the details for the new employee"}
            </DialogDescription>
          </DialogHeader>
          
          <FieldGroup className="py-6 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Employee ID</FieldLabel>
                <Input
                  value={formData.employeeId}
                  onChange={(e) => updateFormData("employeeId", e.target.value)}
                  placeholder="TDA001"
                  className="h-10 border-slate-200 focus:border-slate-400"
                />
              </Field>
              <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Full Name</FieldLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter full name"
                  className="h-10 border-slate-200 focus:border-slate-400"
                />
              </Field>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Gender</FieldLabel>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateFormData("gender", value)}
                >
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Department</FieldLabel>
                <Select
                  value={formData.department}
                  onValueChange={(value) => updateFormData("department", value)}
                >
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Designation</FieldLabel>
                <Select
                  value={formData.designation}
                  onValueChange={(value) => updateFormData("designation", value)}
                >
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGNATIONS.map((des) => (
                      <SelectItem key={des} value={des}>{des}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Joining Date</FieldLabel>
                <Input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => updateFormData("joiningDate", e.target.value)}
                  className="h-10 border-slate-200 focus:border-slate-400"
                />
              </Field>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Contact Number</FieldLabel>
                <Input
                  value={formData.contactNumber}
                  onChange={(e) => updateFormData("contactNumber", e.target.value)}
                  placeholder="17XXXXXX"
                  className="h-10 border-slate-200 focus:border-slate-400"
                />
              </Field>
              <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Email</FieldLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="email@example.com"
                  className="h-10 border-slate-200 focus:border-slate-400"
                />
              </Field>
            </div>
            
            <Field>
              <FieldLabel className="text-sm font-medium text-slate-700">Address</FieldLabel>
              <Input
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Enter address"
                className="h-10 border-slate-200 focus:border-slate-400"
              />
            </Field>
            
            <Field>
              <FieldLabel className="text-sm font-medium text-slate-700">Status</FieldLabel>
              <Select
                value={formData.status}
                onValueChange={(value) => updateFormData("status", value as "Active" | "Inactive")}
              >
                <SelectTrigger className="h-10 border-slate-200 w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          
          <DialogFooter className="border-t border-slate-100 pt-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="h-10 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="h-10 bg-slate-900 hover:bg-slate-800 text-white"
            >
              {editingEmployee ? "Save Changes" : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Delete Employee</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{deletingEmployee?.name}</span>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-10 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="h-10 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}