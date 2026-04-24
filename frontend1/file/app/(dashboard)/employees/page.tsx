"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
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

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Employees</h1>
          <p className="text-sm sm:text-base text-slate-500">
            Manage employee records and information
          </p>
        </div>
        <Button 
          onClick={handleAdd} 
          className="gap-2 bg-[#0b2e4f] text-white shadow-sm h-10 px-5 shrink-0 self-start sm:self-auto border-2 border-transparent hover:bg-white hover:text-[#0b2e4f] hover:border-[#0b2e4f] transition-colors"
        > 
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Stats Overview - Mobile responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Total Employees</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{employees.length}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Active</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                  {employees.filter(e => e.status === "Active").length}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-50 flex items-center justify-center 
              shrink-0">
                <UserCircle className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Departments</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {new Set(employees.map(e => e.department)).size}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-
              0">
                <Building2 className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">This Month</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {employees.filter(e => {
                    const date = new Date(e.joiningDate)
                    const now = new Date()
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/*Filter ui*/} 
      {/* Filters Section */}
      <Card className="border border-slate-200 shadow-none bg-white mb-6">
      <CardContent className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name, ID, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 sm:h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 w-full text-sm"
            />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 sm:h-10 border-slate-200">
                <Building2 className="h-4 w-4 mr-2 text-slate-500 shrink-0" />
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 border-slate-200">
              <UserCircle className="h-4 w-4 mr-2 text-slate-500 shrink-0" />
              <SelectValue placeholder="All Status" />
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

  {/* Employee Table - Fully Responsive */}
<div className="w-full">
  {/* Table Header */}
  <div className="grid grid-cols-4 md:grid-cols-[100px_1fr_1.5fr_120px_120px_100px_100px] gap-0 border-b border-slate-200 bg-[#0B2E4F] rounded-t-lg text-white text-xs font-semibold uppercase tracking-wider">
    <div className="py-3 px-3 text-center">ID</div>
    <div className="py-3 px-3 text-center">Name</div>
    <div className="hidden md:block py-3 px-3 text-center">Email</div>
    <div className="py-3 px-3 text-center">Department</div>
    <div className="hidden md:block py-3 px-3 text-center">Contact</div>
    <div className="py-3 px-3 text-center">Status</div>
    <div className="py-3 px-3 text-center">Actions</div>
  </div>

  {/* Table Body */}
  {filteredEmployees.length === 0 ? (
    <div className="h-32 flex flex-col items-center justify-center text-slate-400 border border-slate-200 rounded-b-lg">
      <Users className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm font-medium">No employees found</p>
      <p className="text-xs">Try adjusting your filters</p>
    </div>
  ) : (
    filteredEmployees.map((employee, index) => (
      <div
        key={employee.id}
        className={cn(
          "grid grid-cols-4 md:grid-cols-[100px_1fr_1.5fr_120px_120px_100px_100px] gap-0 items-center border-l border-r border-b border-slate-200",
          index % 2 === 0 ? "bg-[#FDFDFD]" : "bg-[#F6F6F6]",
          index === filteredEmployees.length - 1 && "rounded-b-lg"
        )}
      >
        {/* ID */}
        <div className="py-3 px-3 text-xs text-slate-900 font-medium truncate text-center">
          {employee.employeeId}
        </div>

        {/* Name */}
        <div className="py-3 px-3 text-sm text-slate-700 truncate text-center">
          {employee.name}
        </div>

        {/* Email (hidden on mobile) */}
        <div className="hidden md:block py-3 px-3 text-sm truncate text-center text-slate-600">
          {employee.email}
        </div>

        {/* Department */}
        <div className="py-3 px-3 text-sm text-slate-700 truncate text-center">
          {employee.department}
        </div>

        {/* Contact (hidden on mobile) */}
        <div className="hidden md:block py-3 px-3 text-sm truncate text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
            <span>{employee.contactNumber}</span>
          </div>
        </div>

        {/* Status */}
        <div className="py-3 px-3 flex justify-center">
          <Badge
            className={cn(
              "text-xs px-2 py-0.5 border-0",
              employee.status === "Active"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            )}
          >
            {employee.status}
          </Badge>
        </div>

        {/* Actions */}
        <div className="py-3 px-3 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(employee)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(employee)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    ))
  )}
</div>
      

      {/* Add/Edit Dialog - Mobile responsive */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto border-slate-200 p-4 sm:p-6">
          <DialogHeader className="border-b border-slate-100 pb-3 sm:pb-4">
            <DialogTitle className="text-base sm:text-lg font-semibold text-slate-900">
              {editingEmployee ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              {editingEmployee
                ? "Update the employee information below"
                : "Enter the details for the new employee"}
            </DialogDescription>
          </DialogHeader>
          
          <FieldGroup className="py-4 sm:py-6 space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Employee ID</FieldLabel>
                <Input
                  value={formData.employeeId}
                  onChange={(e) => updateFormData("employeeId", e.target.value)}
                  placeholder="TDA001"
                  className="h-9 sm:h-10 border-slate-200 focus:border-slate-400"
                />
              </Field>
              <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Full Name</FieldLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter full name"
                  className="h-9 sm:h-10 border-slate-200 focus:border-slate-400"
                />
              </Field>

               <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Email</FieldLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="email@example.com"
                  className="h-9 sm:h-10 border-slate-200 focus:border-slate-400"
                />
              </Field>

              <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Department</FieldLabel>
                <Select
                  value={formData.department}
                  onValueChange={(value) => updateFormData("department", value)}
                >
                  <SelectTrigger className="h-9 sm:h-10 border-slate-200">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

                <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Contact Number</FieldLabel>
                <Input
                  value={formData.contactNumber}
                  onChange={(e) => updateFormData("contactNumber", e.target.value)}
                  placeholder="17XXXXXX"
                  className="h-9 sm:h-10 border-slate-200 focus:border-slate-400"
                />
              </Field>

               <Field>
                <FieldLabel className="text-sm font-medium text-slate-700">Gender</FieldLabel>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateFormData("gender", value)}
                >
                  <SelectTrigger className="h-9 sm:h-10 border-slate-200">
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
              <FieldLabel className="text-sm font-medium text-slate-700">Address</FieldLabel>
              <Input
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Enter address"
                className="h-9 sm:h-10 border-slate-200 focus:border-slate-400"
              />
            </Field>

              <Field>
              <FieldLabel className="text-sm font-medium text-slate-700">Status</FieldLabel>
              <Select
                value={formData.status}
                onValueChange={(value) => updateFormData("status", value as "Active" | "Inactive")}
              >
                <SelectTrigger className="h-9 sm:h-10 border-slate-200 w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            </div>  
          </FieldGroup>
          
          <DialogFooter className="border-t border-slate-100 pt-3 sm:pt-4 gap-2 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="gap-2 bg-[#ba0f0f] text-white shadow-sm h-10 px-5 shrink-0 self-start sm:self-auto border-2 border-transparent hover:bg-white hover:text-[#ba0f0f] hover:border-[#ba0f0f] transition-colors"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="gap-2 bg-[#0b2e4f] text-white shadow-sm h-10 px-5 shrink-0 self-start sm:self-auto border-2 border-transparent hover:bg-white hover:text-[#0b2e4f] hover:border-[#0b2e4f] transition-colors"
            >
              {editingEmployee ? "Save Changes" : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog - Mobile responsive */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-slate-200 max-w-[90vw] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-semibold text-slate-900">Delete Employee</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{deletingEmployee?.name}</span>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-9 sm:h-10 border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="h-9 sm:h-10 bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            >
              Delete Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}