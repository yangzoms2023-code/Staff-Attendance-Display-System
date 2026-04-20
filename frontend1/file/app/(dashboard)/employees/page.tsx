"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground">
            Manage employee records and information
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
              <Users className="h-4 w-4 text-violet-500" />
            </div>
            <CardTitle className="text-base">Employee List</CardTitle>
          </div>
          <CardDescription>
            Total: {filteredEmployees.length} employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employeeId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {employee.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.designation}</TableCell>
                      <TableCell>{employee.contactNumber}</TableCell>
                      <TableCell>
                        <Badge
                          variant={employee.status === "Active" ? "default" : "secondary"}
                          className={cn(
                            employee.status === "Active" && "bg-success/20 text-success hover:bg-success/30"
                          )}
                        >
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(employee)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(employee)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? "Update the employee information below"
                : "Enter the details for the new employee"}
            </DialogDescription>
          </DialogHeader>
          
          <FieldGroup className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Employee ID</FieldLabel>
                <Input
                  value={formData.employeeId}
                  onChange={(e) => updateFormData("employeeId", e.target.value)}
                  placeholder="TDA001"
                />
              </Field>
              <Field>
                <FieldLabel>Full Name</FieldLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter full name"
                />
              </Field>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Gender</FieldLabel>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateFormData("gender", value)}
                >
                  <SelectTrigger>
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
                <FieldLabel>Department</FieldLabel>
                <Select
                  value={formData.department}
                  onValueChange={(value) => updateFormData("department", value)}
                >
                  <SelectTrigger>
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
            
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Designation</FieldLabel>
                <Select
                  value={formData.designation}
                  onValueChange={(value) => updateFormData("designation", value)}
                >
                  <SelectTrigger>
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
                <FieldLabel>Joining Date</FieldLabel>
                <Input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => updateFormData("joiningDate", e.target.value)}
                />
              </Field>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Contact Number</FieldLabel>
                <Input
                  value={formData.contactNumber}
                  onChange={(e) => updateFormData("contactNumber", e.target.value)}
                  placeholder="17XXXXXX"
                />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="email@example.com"
                />
              </Field>
            </div>
            
            <Field>
              <FieldLabel>Address</FieldLabel>
              <Input
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Enter address"
              />
            </Field>
            
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={formData.status}
                onValueChange={(value) => updateFormData("status", value as "Active" | "Inactive")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingEmployee ? "Save Changes" : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingEmployee?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
