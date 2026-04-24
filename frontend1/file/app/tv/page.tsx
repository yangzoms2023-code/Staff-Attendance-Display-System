"use client"

import { useState, useEffect } from "react"
import { dataStore } from "@/lib/data-store"
import type { Employee, AttendanceRecord, OutingRequest } from "@/lib/types"
import { BackgroundPattern } from '@/components/background-pattern'

export default function TVDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [outingRequests, setOutingRequests] = useState<OutingRequest[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All")

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    dataStore.init()
    loadData()

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Auto-refresh data every 30 seconds
    const refreshInterval = setInterval(() => {
      loadData()
    }, 30000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(refreshInterval)
    }
  }, [])

  const loadData = () => {
    const emps = dataStore.getEmployees().filter(e => e.status === "Active")
    const att = dataStore.getAttendanceByDate(today)
    const todayOutings = dataStore.getTodayOutingRequests()
    
    setEmployees(emps)
    setAttendance(att)
    setOutingRequests(todayOutings)
  }

  const getEmployeeAttendance = (employeeId: string): AttendanceRecord | undefined => {
    return attendance.find(a => a.employeeId === employeeId)
  }

  const getEmployeeOutingStatus = (employeeId: string): OutingRequest | undefined => {
    return outingRequests.find(
      r => r.employeeId === employeeId && r.status === "approved" && !r.actualReturnTime
    )
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).toUpperCase().replace(",", "")
  }

  // Get unique departments
  const departments = ["All", ...Array.from(new Set(employees.map(e => e.department)))]

  // Filter employees by selected department
  const filteredEmployees = selectedDepartment === "All" 
    ? employees 
    : employees.filter(e => e.department === selectedDepartment)

  // Calculate stats for filtered employees
  const getStaffStats = () => {
    let inOffice = 0
    let onDuty = 0
    let outOfOffice = 0

    filteredEmployees.forEach(employee => {
      const record = getEmployeeAttendance(employee.id)
      const outingStatus = getEmployeeOutingStatus(employee.id)
      const status = record?.status ?? "Absent"

      if (outingStatus) {
        if (outingStatus.purpose === "official") {
          onDuty++
        } else {
          outOfOffice++
        }
      } else if (status === "Present" || status === "Late") {
        inOffice++
      } else {
        outOfOffice++
      }
    })

    return { inOffice, onDuty, outOfOffice, total: filteredEmployees.length }
  }
  
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <BackgroundPattern />
      {/* Header - Dark Navy */}
      <header className="px-10 py-3 bg-transparent bg-white/50 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <img
              src="/icon.png" alt="Logo" className="h-18 w-18 object-contain item-center"
            />
            {/* Text */}
            <div>
              <h1 className="text-xl font-bold text-[#0B2E4F]">
                Staff Information Display
              </h1>
              <p className="text-sm text-slate-800 font-semibold">
                Thimphu Dzongkhag Administration
              </p>
            </div>
          </div>
          {/* Right Section */}
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-[#0B2E4F]">
              {formatDate(currentTime)}
            </span>
            <div className="h-6 w-px bg-slate-500" />
              <span className="text-lg font-semibold tabular-nums text-[#0B2E4F]">
                {formatTime(currentTime)}
              </span>
            </div>
        </div>
      </header>

      {/* Department Title Section */}
      <div className="flex items-center justify-center gap-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#0B2E4F]">ALL DEPARTMENT</h2>
        </div>
      </div>

      {/* Department Filter Tabs */}
      <div className="flex justify-center gap-2 px-8 pb-4">
        {departments.map(dept => (
          <button
            key={dept}
            onClick={() => setSelectedDepartment(dept)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedDepartment === dept
                ? "bg-[#0B2E4F] text-white"
                : "bg-white text-[#0B2E4F] hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Staff Table */}
      <div className="flex-1 px-8 pb-4">
        <div className="overflow-hidden rounded-lg bg-white shadow-sm item-center">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0B2E4F] text-white">
                <th className="px-4 py-3 text-left text-sm font-semibold">Sl No.</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name of Official</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Contact Number</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Check In</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Check OUT</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee, index) => {
                const record = getEmployeeAttendance(employee.id)
                const outingStatus = getEmployeeOutingStatus(employee.id)
                const status = record?.status ?? "Absent"
                
                let displayStatus: "In Office" | "On Duty" | "Out of Office"
                let remarks: string = ""

                if (outingStatus) {
                  if (outingStatus.purpose === "official") {
                    displayStatus = "On Duty"
                    remarks = outingStatus.willReturn 
                      ? `Will be back at ${outingStatus.expectedReturnTime}`
                      : "On official duty"
                  } else {
                    displayStatus = "Out of Office"
                    remarks = outingStatus.willReturn 
                      ? `Will be back at ${outingStatus.expectedReturnTime}`
                      : "Stepped out"
                  }
                } else if (status === "Present" || status === "Late") {
                    if (record?.checkOut) {
                      displayStatus = "Out of Office"
                      remarks = "Checked out"
                    } else {
                      displayStatus = "In Office"
                      remarks = status === "Late" ? "Late arrival" : "On time"
                    }
                } else if (status === "Leave") {
                  displayStatus = "Out of Office"
                  remarks = "On leave"
                } else {
                  displayStatus = "Out of Office"
                  remarks = "Not checked in"
                }

                const checkInTime = record?.checkIn || "-"
                const checkOutTime = record?.checkOut || "-"

                return (
                  <tr 
                    key={employee.id} 
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-700 item-center">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 item-center">{employee.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 item-center">{employee.contactNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 item-center">{checkInTime}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 item-center">{checkOutTime}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={displayStatus} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 item-center">{remarks}</td>
                  </tr>
                )
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No staff members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
      </div>

      {/* Footer - Dark Navy with Stats */}
      <footer className="mt-auto bg-[#0B2E4F] py-2">
        <div className="flex justify-center items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-white">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-white">On Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-xs text-white">Out of Office</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StatusBadge({ status }: { status: "In Office" | "On Duty" | "Out of Office" }) {
  const styles = {
    "In Office": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "On Duty": "bg-amber-50 text-amber-600 border-amber-200",
    "Out of Office": "bg-red-50 text-red-600 border-red-200"
  }

  const dotStyles = {
    "In Office": "bg-emerald-500",
    "On Duty": "bg-amber-500",
    "Out of Office": "bg-red-500"
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      {status}
    </span>
  )
}