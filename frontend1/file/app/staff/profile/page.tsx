"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { dataStore } from "@/lib/data-store"
import type { Employee } from "@/lib/types"
import {
  Mail, Phone, MapPin, Briefcase,
  Calendar, ShieldCheck, ArrowLeft,
  Camera, Edit2, Save, X,
  Award, Clock, CheckCircle2, ChevronRight,
  User, Building2, CreditCard
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Image from "next/image"

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    designation: ""
  })

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

    if (emp) {
      setEmployee(emp)
      setFormData({
        name: emp.name,
        email: emp.email,
        phone: emp.contactNumber || "",
        address: emp.address || "",
        department: emp.department,
        designation: emp.designation
      })
    }

    setLoading(false)
  }, [user, router])

  const handleSave = () => {
    if (employee) {
      const updatedEmployee = {
        ...employee,
        name: formData.name,
        email: formData.email,
        contactNumber: formData.phone,
        address: formData.address,
        updatedAt: new Date().toISOString()
      }
      // FIX: Pass both the employee ID and the updated employee object
      dataStore.updateEmployee(employee.id, updatedEmployee)
      setEmployee(updatedEmployee)
      setIsEditing(false)
    }
  }

  const handleDiscard = () => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.contactNumber || "",
        address: employee.address || "",
        department: employee.department,
        designation: employee.designation
      })
      setIsEditing(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-pulse text-slate-500">Loading profile...</div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Employee not found</p>
          <Button onClick={() => router.push("/staff")}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  // Calculate stats
  const attendanceHistory = dataStore.getAttendanceByEmployee(employee.id)
  const presentCount = attendanceHistory.filter(a => a.status === "Present").length
  const attendanceRate = attendanceHistory.length > 0
    ? Math.round((presentCount / attendanceHistory.length) * 100)
    : 0
  const approvedOutings = dataStore.getOutingRequestsByEmployee(employee.id).filter(r => r.status === "approved").length
  const joinedDate = new Date(employee.joiningDate)
  const yearsOfService = Math.floor((new Date().getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 365))

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900">
      {/* Slim Navbar */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/staff")}
            className="text-slate-500 hover:text-[#ffffff] hover:bg-[#0B2E4F]"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-2" />
            <span className="font-bold text-[11px] uppercase tracking-wider">Dashboard</span>
          </Button>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-[#0B2E4F] h-8 text-[11px] font-bold hover:bg-[#1a456b]"
              >
                <Edit2 className="h-3 w-3 mr-2" /> EDIT PROFILE
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDiscard} className="h-8 text-[11px] font-bold hover:bg-[#1a456b]">
                  <X className="h-3 w-3 mr-2" /> DISCARD
                </Button>
                <Button size="sm" onClick={handleSave} className="bg-[#1a456b] h-8 text-[11px] font-bold hover:bg-[#1a457b]">
                  <Save className="h-3 w-3 mr-2" /> SAVE
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 space-y-4">

        {/* Compact Hero Section */}
        <section className="relative rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200">
          <div className="h-24 w-full bg-gradient-to-r from-[#0B2E4F] to-[#1a5a92]" />
          <div className="px-6 pb-4">
            <div className="relative flex flex-row items-center gap-4 -mt-8">
              <div className="relative group">
                <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg border border-slate-100">
                  <div className="h-full w-full rounded-xl bg-gradient-to-br from-[#0B2E4F] to-[#1a456b] flex items-center justify-center text-3xl font-bold text-white">
                    {employee.name.charAt(0)}
                  </div>
                </div>
                {isEditing && (
                  <button className="absolute inset-0 m-1 flex items-center justify-center bg-black/40 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="flex-1 pt-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">{employee.name}</h1>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0 border-emerald-100">
                    {employee.status === "Active" ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
                <p className="text-slate-500 font-medium text-xs">{employee.designation} • {employee.department}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tight Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Left Column: Metadata & Stats */}
          <div className="lg:col-span-4 space-y-4">
            {/* Condensed Stats */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200/60 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100/50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Attendance</p>
                  <p className="text-sm font-black text-emerald-600">{attendanceRate}%</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100/50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Leave Bal.</p>
                  <p className="text-sm font-black text-blue-600">18 Days</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100/50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Service</p>
                  <p className="text-sm font-black text-amber-600">{yearsOfService} Yrs</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100/50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Outings</p>
                  <p className="text-sm font-black text-purple-600">{approvedOutings}</p>
                </div>
              </div>
            </Card>

            {/* Metadata Card */}
            <Card className="rounded-xl border-none shadow-sm ring-1 ring-slate-200/60">
              <CardHeader className="py-3 px-4 border-b border-slate-50">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Employment Metadata</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Employee ID</p>
                  <p className="font-mono text-xs font-semibold text-slate-700">{employee.employeeId}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Department</p>
                  <p className="text-xs font-semibold text-slate-700">{employee.department}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Joining Date</p>
                  <p className="text-xs font-semibold text-slate-700">
                    {new Date(employee.joiningDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Gender</p>
                  <p className="text-xs font-semibold text-slate-700">{employee.gender}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Account Info */}
          <div className="lg:col-span-8">
            <Card className="rounded-xl border-none shadow-sm ring-1 ring-slate-200/60 h-full bg-white flex flex-col">
              <CardHeader className="py-5 px-8 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">Account Details</CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Primary Contact Records</p>
                  </div>
                  <Badge className="bg-slate-50 text-slate-500 border-slate-200 text-[9px] font-bold px-2 py-0.5">
                    VERIFIED
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-8 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">

                  {/* Name Field - Read-only */}
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                      Full Name
                    </Label>
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-1">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">{formData.name}</span>
                    </div>
                  </div>

                  {/* Department Field - Read-only */}
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                      Department
                    </Label>
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-1">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">{formData.department}</span>
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2.5 group">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-0.5 group-focus-within:text-indigo-500 transition-colors">
                      Email Address
                    </Label>
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-1 group-focus-within:border-indigo-500 transition-all">
                      <Mail className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors duration-300",
                        isEditing ? "text-indigo-500" : "text-slate-400"
                      )} />
                      <input
                        readOnly={!isEditing}
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={cn(
                          "w-full bg-transparent text-sm font-semibold outline-none border-none p-0 h-7",
                          isEditing ? "text-slate-900" : "text-slate-600 cursor-default"
                        )}
                      />
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2.5 group">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-0.5 group-focus-within:text-indigo-500 transition-colors">
                      Contact Phone
                    </Label>
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-1 group-focus-within:border-indigo-500 transition-all">
                      <Phone className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors duration-300",
                        isEditing ? "text-indigo-500" : "text-slate-400"
                      )} />
                      <input
                        readOnly={!isEditing}
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="Not provided"
                        className={cn(
                          "w-full bg-transparent text-sm font-semibold outline-none border-none p-0 h-7",
                          isEditing ? "text-slate-900" : "text-slate-600 cursor-default"
                        )}
                      />
                    </div>
                  </div>

                  {/* Designation Field - Read-only */}
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                      Designation
                    </Label>
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-1">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">{formData.designation}</span>
                    </div>
                  </div>

                  {/* Address Field */}
                  <div className="space-y-2.5 group md:col-span-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-0.5 group-focus-within:text-indigo-500 transition-colors">
                      Residential Address
                    </Label>
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-1 group-focus-within:border-indigo-500 transition-all">
                      <MapPin className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors duration-300",
                        isEditing ? "text-indigo-500" : "text-slate-400"
                      )} />
                      <input
                        readOnly={!isEditing}
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        placeholder="Not provided"
                        className={cn(
                          "w-full bg-transparent text-sm font-semibold outline-none border-none p-0 h-7",
                          isEditing ? "text-slate-900" : "text-slate-600 cursor-default"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>

              {isEditing && (
                <div className="px-8 pb-8 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100/50">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    <p className="text-[11px] text-indigo-700 font-medium">
                      You are currently modifying sensitive personnel data. Click save to confirm changes.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}