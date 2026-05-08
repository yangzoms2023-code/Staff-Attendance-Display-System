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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel } from "@/components/ui/field"
import { dataStore, DEPARTMENTS } from "@/lib/data-store"
import type { Employee } from "@/lib/types"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users, Building2, Calendar, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Thimphu locations for address dropdown
const THIMPHU_LOCATIONS = ["Changangkha", "Motithang", "Babesa", "Dechencholing", "Taba"]

type EmployeeFormData = Omit<Employee, "id" | "createdAt" | "updatedAt"> & {
  inactiveReason?: string
}

const emptyFormData: EmployeeFormData = {
  employeeId: "",
  name: "",
  gender: "Male",
  designation: "",
  contactNumber: "",
  email: "",
  address: "",
  department: "",
  joiningDate: new Date().toISOString().split('T')[0],
  status: "Active",
  inactiveReason: "",
}

type ValidationErrors = {
  employeeId?: string
  name?: string
  email?: string
  department?: string
  gender?: string
  contactNumber?: string
  inactiveReason?: string
  // address removed – optional
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
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

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
    if (departmentFilter !== "all") filtered = filtered.filter((emp) => emp.department === departmentFilter)
    if (statusFilter !== "all") filtered = filtered.filter((emp) => emp.status === statusFilter)
    setFilteredEmployees(filtered)
  }

  // Helper: generate unique 6-digit numeric ID (TDA prefix + 6 digits)
  const generateEmployeeId = () => {
    let newId: string
    let exists = true
    do {
      const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, "0")
      newId = `TDA${randomNum}`
      exists = employees.some(emp => emp.employeeId === newId)
    } while (exists)
    return newId
  }

  const isEmployeeIdUnique = (id: string, excludeId?: string) => {
    return !employees.some(emp => emp.employeeId === id && emp.id !== excludeId)
  }

  // Validation helpers
  const validateName = (name: string) => {
    if (!name.trim()) return "Full name is required."
    if (!/[a-zA-Z]/.test(name)) return "Name must contain at least one letter."
    return undefined
  }

  const validateField = (field: keyof EmployeeFormData, value: string, form: EmployeeFormData, isEditing: boolean, currentEmployeeId?: string): string | undefined => {
    switch (field) {
      case "employeeId":
        if (!value.trim()) return "Employee ID is required."
        if (!isEmployeeIdUnique(value, currentEmployeeId)) return "Employee ID must be unique."
        return undefined
      case "name":
        return validateName(value)
      case "email":
        if (!value.trim()) return "Email address is required."
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/
        if (!emailRegex.test(value)) return "Please enter a valid email address."
        return undefined
      case "department":
        if (!value) return "Please select a department."
        return undefined
      case "gender":
        if (!value) return "Please select a gender."
        return undefined
      case "contactNumber":
        const digitsOnly = value.replace(/\D/g, "")
        if (digitsOnly.length !== 8) return "Contact number must be exactly 8 digits."
        return undefined
      case "inactiveReason":
        if (form.status === "Inactive" && (!value.trim())) return "Please provide a reason for inactive status."
        return undefined
      default:
        return undefined
    }
  }

  const validateForm = (form: EmployeeFormData, isEditing: boolean, currentEmployeeId?: string): boolean => {
    const newErrors: ValidationErrors = {}
    // address is not required, so excluded
    const fieldsToValidate: (keyof EmployeeFormData)[] = ["employeeId", "name", "email", "department", 
      "gender", "contactNumber"]
    if (form.status === "Inactive") fieldsToValidate.push("inactiveReason")
    
    for (const field of fieldsToValidate) {
      const error = validateField(field, form[field] as string, form, isEditing, currentEmployeeId)
      if (error) newErrors[field] = error
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateFormData = (field: keyof EmployeeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, value, { ...formData, [field]: value }, !!editingEmployee, 
      editingEmployee?.id)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleBlur = (field: keyof EmployeeFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field] as string, formData, !!editingEmployee, 
      editingEmployee?.id)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleAdd = () => {
    setEditingEmployee(null)
    setFormData({
      ...emptyFormData,
      employeeId: generateEmployeeId(),
      joiningDate: new Date().toISOString().split('T')[0],
      inactiveReason: "",
    })
    setErrors({})
    setTouched({})
    setIsDialogOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    // Strip +975 prefix for display
    let rawContact = employee.contactNumber
    if (rawContact.startsWith("+975")) rawContact = rawContact.slice(4)
    setFormData({
      employeeId: employee.employeeId,
      name: employee.name,
      gender: employee.gender,
      designation: employee.designation,
      contactNumber: rawContact,
      email: employee.email,
      address: employee.address,
      department: employee.department,
      joiningDate: employee.joiningDate,
      status: employee.status,
      inactiveReason: employee.inactiveReason || "",
    })
    setErrors({})
    setTouched({})
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
    const isValid = validateForm(formData, !!editingEmployee, editingEmployee?.id)
    if (!isValid) {
      const allFields: (keyof EmployeeFormData)[] = ["employeeId", "name", "email", "department", "gender", 
        "contactNumber"]
      if (formData.status === "Inactive") allFields.push("inactiveReason")
      const newTouched = allFields.reduce((acc, f) => ({ ...acc, [f]: true }), {})
      setTouched(newTouched)
      return
    }

    const finalContact = `+975${formData.contactNumber.replace(/\D/g, "")}`
    const saveData = {
      ...formData,
      contactNumber: finalContact,
    }
    if (editingEmployee) {
      dataStore.updateEmployee(editingEmployee.id, saveData)
    } else {
      dataStore.addEmployee(saveData)
    }
    loadEmployees()
    setIsDialogOpen(false)
    setEditingEmployee(null)
    setFormData(emptyFormData)
    setErrors({})
    setTouched({})
  }

  const getDisplayContact = (contact: string) => {
    if (contact.startsWith("+975")) return contact.slice(4)
    return contact
  }

  return (
    <TooltipProvider>
      <div className="w-full min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Employees</h1>
            <p className="text-sm sm:text-base text-slate-500">Manage employee records and information</p>
          </div>
          <Button onClick={handleAdd} className="gap-2 bg-[#0b2e4f] text-white shadow-sm h-10 px-5 shrink-0 
          self-start sm:self-auto border-2 border-transparent hover:bg-white hover:text-[#0b2e4f] border 
          border-[#0B2E4F] transition-colors">
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
  {/* Total Employees */}
  <Card className="border-0 shadow-sm">
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Total Employees</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{employees.length}</p>
        </div>
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Active */}
  <Card className="border-0 shadow-sm">
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Active</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">{employees.filter(e => e.status === "Active").length}</p>
        </div>
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
          <UserCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Departments */}
  <Card className="border-0 shadow-sm">
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Departments</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{new Set(employees.map(e => e.department)).size}</p>
        </div>
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
        </div>
      </div>
    </CardContent>
  </Card>

  {/* New Hires */}
  <Card className="border-0 shadow-sm">
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">New Hires</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {employees.filter(e => {
              if (!e.joiningDate) return false
              const date = new Date(e.joiningDate)
              const now = new Date()
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
            }).length}
          </p>
        </div>
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
        </div>
      </div>
    </CardContent>
  </Card>
</div>

        {/* Filters */}
        <Card className="border border-slate-200 shadow-none bg-white mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search by name, ID, email..." value={searchQuery} onChange={(e) => 
                  setSearchQuery(e.target.value)} className="pl-10 h-9 sm:h-10 border-slate-200 focus:border-
                  slate-400 w-full text-sm" />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 sm:h-10 border-slate-200 focus:ring-
                  [#0B2E4F] focus:border-[#0B2E4F] data-[state=open]:border-[#0B2E4F] data-
                  [state=open]:ring-1 data-[state=open]:ring-[#0B2E4F]">
                    <Building2 className="h-4 w-4 mr-2 text-slate-500 shrink-0" />
                    <SelectValue placeholder="Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="hover:bg-[#0B2E4F] hover:text-white focus:bg-
                    [#0B2E4F] focus:text-white">All Departments</SelectItem>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept} className="hover:bg-[#0B2E4F] hover:text-white 
                      focus:bg-[#0B2E4F] focus:text-white">{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 border-slate-200 focus:ring-
                  [#0B2E4F] focus:border-[#0B2E4F] data-[state=open]:border-[#0B2E4F] data-
                  [state=open]:ring-1 data-[state=open]:ring-[#0B2E4F]">
                    <UserCircle className="h-4 w-4 mr-2 text-slate-500 shrink-0" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="hover:bg-[#0B2E4F] hover:text-white focus:bg-
                    [#0B2E4F] focus:text-white">All Status</SelectItem>
                    <SelectItem value="Active" className="hover:bg-[#0B2E4F] hover:text-white focus:bg-
                    [#0B2E4F] focus:text-white">Active</SelectItem>
                    <SelectItem value="Inactive" className="hover:bg-[#0B2E4F] hover:text-white focus:bg-
                    [#0B2E4F] focus:text-white">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[100px_1fr_1.5fr_120px_120px_100px_80px] gap-0 border-b border-
            slate-200 bg-[#0B2E4F] text-white text-xs font-semibold uppercase tracking-wider">
              <div className="py-3 px-4">ID</div><div className="py-3 px-4">Name</div><div className="py-3 
              px-4">Email</div>
              <div className="py-3 px-4">Department</div><div className="py-3 px-4 text-center">Contact</div>
              <div className="py-3 px-4 text-center">Status</div><div className="py-3 px-4 text-
              center">Actions</div>
            </div>
            {filteredEmployees.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-slate-400 bg-white">
                <Users className="h-8 w-8 mb-2 opacity-50" /><p className="text-sm font-medium">No employees 
                  found</p>
              </div>
            ) : (
              filteredEmployees.map((employee, index) => (
                <div key={employee.id} className={cn("grid grid-cols-[100px_1fr_1.5fr_120px_120px_100px_80px] gap-0 items-center border-b border-slate-200 last:border-0", index % 2 === 0 ? "bg-[#FDFDFD]" : "bg-[#F6F6F6]")}>
                  <div className="py-3 px-4 text-xs font-mono">{employee.employeeId}</div>
                  <div className="py-3 px-4 text-sm font-medium truncate">{employee.name}</div>
                  <div className="py-3 px-4 text-sm text-slate-600 truncate">{employee.email}</div>
                  <div className="py-3 px-4 text-sm">{employee.department}</div>
                  <div className="py-3 px-4 text-sm text-center">{getDisplayContact(employee.contactNumber)}

                  </div>
                  <div className="py-3 px-4 flex justify-center">
                    {employee.status === "Inactive" && employee.inactiveReason ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge className="bg-slate-100 text-slate-600 text-xs border-0 cursor-
                          pointer">Inactive</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{employee.inactiveReason}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge className={cn("text-xs border-0", employee.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                        {employee.status}
                      </Badge>
                    )}
                  </div>
                  <div className="py-3 px-4 flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-
                        slate-600 hover:bg-[#0B2E4F] hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[120px]">
                        <DropdownMenuItem onClick={() => handleEdit(employee)} className="cursor-pointer 
                        hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white">
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(employee)} className="text-red-600 
                        cursor-pointer hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-
                        700">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
              <DialogDescription>Fill in the employee details below.</DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee ID */}
                <Field>
                  <FieldLabel>Employee ID <span className="text-red-500">*</span></FieldLabel>
                  <Input value={formData.employeeId} onChange={(e) => updateFormData("employeeId", 
                    e.target.value)} onBlur={() => handleBlur("employeeId")} className={cn(errors.employeeId 
                    && touched.employeeId && "border-red-500")} />
                  {errors.employeeId && touched.employeeId && <p className="text-xs text-red-500 mt-1">
                    {errors.employeeId}</p>}
                </Field>
                
                {/* Name */}
                <Field>
                  <FieldLabel>Full Name <span className="text-red-500">*</span></FieldLabel>
                  <Input value={formData.name} onChange={(e) => updateFormData("name", e.target.value)} 
                  onBlur={() => handleBlur("name")} autoComplete="off" className={cn(errors.name && touched.name && "border-red-500")} />
                  {errors.name && touched.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </Field>
                
                {/* Email */}
                <Field>
                  <FieldLabel>Email <span className="text-red-500">*</span></FieldLabel>
                  <Input type="email" value={formData.email} onChange={(e) => updateFormData("email", 
                    e.target.value)} onBlur={() => handleBlur("email")} className={cn(errors.email && 
                    touched.email && "border-red-500")} />
                  {errors.email && touched.email && <p className="text-xs text-red-500 mt-1">{errors.email}
                    </p>}
                </Field>
                
                {/* Department */}
                <Field>
                  <FieldLabel>Department <span className="text-red-500">*</span></FieldLabel>
                  <Select value={formData.department} onValueChange={(v) => updateFormData("department", v)}>
                    <SelectTrigger className={cn(errors.department && touched.department && "border-red-500", 
                      "focus:ring-[#0B2E4F] focus:border-[#0B2E4F] data-[state=open]:border-[#0B2E4F] data-[state=open]:ring-1 data-[state=open]:ring-[#0B2E4F]")}>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => (
                        <SelectItem key={d} value={d} className="hover:bg-[#0B2E4F] hover:text-white 
                        focus:bg-[#0B2E4F] focus:text-white">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && touched.department && <p className="text-xs text-red-500 mt-1">
                    {errors.department}</p>}
                </Field>
                
                {/* Contact Number */}
                <Field>
                  <FieldLabel>Contact Number <span className="text-red-500">*</span></FieldLabel>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-
                    slate-200 bg-slate-50 text-slate-600">+975</span>
                    <Input value={formData.contactNumber} onChange={(e) => { const digits = 
                      e.target.value.replace(/\D/g, "").slice(0, 8); updateFormData("contactNumber", digits); 
                      }} onBlur={() => 
                      handleBlur("contactNumber")} className={cn("rounded-l-none", errors.contactNumber && 
                      touched.contactNumber && "border-red-500")} />
                  </div>
                  {errors.contactNumber && touched.contactNumber && <p className="text-xs text-red-500 mt-1">
                    {errors.contactNumber}</p>}
                </Field>
                
                {/* Joining Date */}
                <Field><FieldLabel>Joining Date</FieldLabel><Input type="date" value={formData.joiningDate} 
                onChange={(e) => updateFormData("joiningDate", e.target.value)} /></Field>
                
                {/* Gender */}
                <Field>
                  <FieldLabel>Gender <span className="text-red-500">*</span></FieldLabel>
                  <Select value={formData.gender} onValueChange={(v) => updateFormData("gender", v)}>
                    <SelectTrigger className={cn(errors.gender && touched.gender && "border-red-500", 
                      "focus:ring-[#0B2E4F] focus:border-[#0B2E4F] data-[state=open]:border-[#0B2E4F] data-[state=open]:ring-1 data-[state=open]:ring-[#0B2E4F]")}>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male" className="hover:bg-[#0B2E4F] hover:text-white focus:bg-
                      [#0B2E4F] focus:text-white">Male</SelectItem>
                      <SelectItem value="Female" className="hover:bg-[#0B2E4F] hover:text-white focus:bg-
                      [#0B2E4F] focus:text-white">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && touched.gender && <p className="text-xs text-red-500 mt-1">
                    {errors.gender}</p>}
                </Field>
                
                {/* Status */}
                <Field>
                  <FieldLabel>Status <span className="text-red-500">*</span></FieldLabel>
                  <Select value={formData.status} onValueChange={(v) => updateFormData("status", v)}>
                    <SelectTrigger className="focus:ring-[#0B2E4F] focus:border-[#0B2E4F] data-
                    [state=open]:border-[#0B2E4F] data-[state=open]:ring-1 data-[state=open]:ring-
                    [#0B2E4F]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active" className="hover:bg-[#0B2E4F] hover:text-white focus:bg-
                      [#0B2E4F] focus:text-white">Active</SelectItem>
                      <SelectItem value="Inactive" className="hover:bg-[#0B2E4F] hover:text-white focus:bg-
                      [#0B2E4F] focus:text-white">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {/* Inactive Reason */}
              {formData.status === "Inactive" && (
                <Field>
                  <FieldLabel>Reason for Inactive Status <span className="text-red-500">*</span></FieldLabel>
                  <Input value={formData.inactiveReason || ""} onChange={(e) => 
                    updateFormData("inactiveReason", e.target.value)} onBlur={() => 
                    handleBlur("inactiveReason")} className={cn(errors.inactiveReason && 
                    touched.inactiveReason && "border-red-500")} placeholder="e.g., Resigned, Medical leave, 
                    etc." />
                  {errors.inactiveReason && touched.inactiveReason && <p className="text-xs text-red-500 mt-
                  1">{errors.inactiveReason}</p>}
                </Field>
              )}

              {/* Address - Optional */}
              <Field>
                <FieldLabel>Address (Thimphu)</FieldLabel>
                <Select value={formData.address} onValueChange={(v) => updateFormData("address", v)}>
                  <SelectTrigger className="focus:ring-[#0B2E4F] focus:border-[#0B2E4F] data-
                  [state=open]:border-[#0B2E4F] data-[state=open]:ring-1 data-[state=open]:ring-[#0B2E4F]">
                    <SelectValue placeholder="Select location (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {THIMPHU_LOCATIONS.map(loc => (
                      <SelectItem key={loc} value={loc} className="hover:bg-[#0B2E4F] hover:text-white 
                      focus:bg-[#0B2E4F] focus:text-white">
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <DialogFooter className="p-6 pt-0 gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-red-600 
              text-white hover:bg-white hover:text-red-600 hover:border-red-600">Cancel</Button>
              <Button
  onClick={handleSave}
  className="bg-[#0b2e4f] text-white hover:bg-white hover:text-[#0b2e4f] hover:border hover:border-[#0b2e4f]"
>
  Save
</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Confirm Delete</DialogTitle><DialogDescription>Are you sure you 
              want 
              to delete {deletingEmployee?.name}?</DialogDescription></DialogHeader>
            <DialogFooter className="gap-2"><Button variant="outline" onClick={() => 
              setIsDeleteDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick=
              {confirmDelete}>Delete</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}