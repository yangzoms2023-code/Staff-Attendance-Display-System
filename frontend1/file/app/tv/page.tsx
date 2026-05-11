"use client"

import { useState, useEffect, useRef } from "react"
import { dataStore } from "@/lib/data-store"
import type { Employee, LeaveRequest } from "@/lib/types"
import { BackgroundPattern } from '@/components/background-pattern'

export default function TVDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeStatuses, setEmployeeStatuses] = useState<Map<string, { status: string; remarks: string }>>(new Map())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All")
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [isChangingDepartment, setIsChangingDepartment] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const departmentTimerRef = useRef<NodeJS.Timeout | null>(null)

  const today = new Date().toISOString().split("T")[0]

  const departments = ["All", ...Array.from(new Set(employees.map(e => e.department)))]

  useEffect(() => {
    dataStore.init()
    loadData()

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    const refreshInterval = setInterval(loadData, 30000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(refreshInterval)
      if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current)
      if (departmentTimerRef.current) clearTimeout(departmentTimerRef.current)
    }
  }, [])

  const loadData = () => {
    const emps = dataStore.getEmployees().filter(e => e.status === "Active")
    setEmployees(emps)

    // Get all leave requests
    const leaveRequests: LeaveRequest[] = dataStore.getLeaveRequests()

    const statuses = new Map()
    emps.forEach(emp => {
      // Check if employee is on leave today
      const activeLeave = leaveRequests.find(l =>
        l.employeeId === emp.id && l.startDate <= today && l.endDate >= today
      )

      if (activeLeave) {
        // Format dates for display
        const start = new Date(activeLeave.startDate).toLocaleDateString()
        const end = new Date(activeLeave.endDate).toLocaleDateString()
        statuses.set(emp.id, {
          status: "On Leave",
          remarks: `Leave from ${start} to ${end}`
        })
      } else {
        // Use regular attendance/outing status
        const status = dataStore.getEmployeeCurrentStatus(emp.id, today)
        statuses.set(emp.id, status)
      }
    })
    setEmployeeStatuses(statuses)
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
      month: "short",
      day: "numeric",
      year: "numeric"
    }).toUpperCase()
  }

  const filteredEmployees = selectedDepartment === "All"
    ? employees
    : employees.filter(e => e.department === selectedDepartment)

  const startVerticalScrolling = () => {
    if (!scrollContainerRef.current || filteredEmployees.length === 0) return

    const scrollContainer = scrollContainerRef.current
    let scrollAmount = scrollContainer.scrollTop
    const scrollStep = 1
    const scrollInterval = 30

    if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current)

    const totalScrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight

    if (totalScrollHeight <= 0) {
      setIsAutoScrolling(false)
      startDepartmentHoldTimer()
      return
    }

    autoScrollIntervalRef.current = setInterval(() => {
      if (scrollContainer && isAutoScrolling && !isChangingDepartment) {
        scrollAmount += scrollStep

        if (scrollAmount >= totalScrollHeight) {
          clearInterval(autoScrollIntervalRef.current!)
          autoScrollIntervalRef.current = null
          setIsAutoScrolling(false)
          startDepartmentHoldTimer()
        } else {
          scrollContainer.scrollTop = scrollAmount
        }
      }
    }, scrollInterval)
  }

  const startDepartmentHoldTimer = () => {
    if (departmentTimerRef.current) clearTimeout(departmentTimerRef.current)

    departmentTimerRef.current = setTimeout(() => {
      moveToNextDepartment()
    }, 10000)
  }

  const stopDepartmentHoldTimer = () => {
    if (departmentTimerRef.current) {
      clearTimeout(departmentTimerRef.current)
      departmentTimerRef.current = null
    }
  }

  const moveToNextDepartment = () => {
    if (isChangingDepartment) return

    setIsChangingDepartment(true)
    setIsAutoScrolling(false)
    stopDepartmentHoldTimer()

    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current)
      autoScrollIntervalRef.current = null
    }

    const currentIndex = departments.indexOf(selectedDepartment)
    const nextIndex = (currentIndex + 1) % departments.length
    const nextDepartment = departments[nextIndex]

    setSelectedDepartment(nextDepartment)

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }

    setIsChangingDepartment(false)
    setIsAutoScrolling(true)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filteredEmployees.length > 0 && isAutoScrolling && !isChangingDepartment) {
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
        startVerticalScrolling()
      } else if (filteredEmployees.length > 0 && !isAutoScrolling && !isChangingDepartment && !departmentTimerRef.current) {
        startDepartmentHoldTimer()
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [filteredEmployees.length, selectedDepartment])

  const handleMouseEnter = () => {
    setIsAutoScrolling(false)
    stopDepartmentHoldTimer()
    if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current)
  }

  const handleMouseLeave = () => {
    if (!isChangingDepartment) setIsAutoScrolling(true)
  }

  const handleDepartmentClick = (dept: string) => {
    if (isChangingDepartment || dept === selectedDepartment) return

    setIsChangingDepartment(true)
    setIsAutoScrolling(false)
    stopDepartmentHoldTimer()
    if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current)

    setSelectedDepartment(dept)
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0

    setTimeout(() => {
      setIsChangingDepartment(false)
      setIsAutoScrolling(true)
    }, 100)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <BackgroundPattern />
      <header className="px-10 py-3 bg-transparent bg-white/50 backdrop-blur-sm border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/icon.png" alt="Logo" className="h-18 w-18 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-[#0B2E4F]">Staff Information Display</h1>
              <p className="text-sm text-slate-800 font-semibold">Thimphu Dzongkhag Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${!isChangingDepartment ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              <span className="text-xs font-medium text-[#0B2E4F]">
                {isChangingDepartment ? 'Switching...' : (isAutoScrolling ? 'Scrolling' : 'Holding')}
              </span>
            </div>
            <span className="text-lg font-semibold text-[#0B2E4F]">{formatDate(currentTime)}</span>
            <div className="h-6 w-px bg-slate-500" />
            <span className="text-lg font-semibold tabular-nums text-[#0B2E4F]">{formatTime(currentTime)}</span>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center gap-4 pt-10 pb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-[#0B2E4F] transition-all duration-300">
          {selectedDepartment === "All" ? "ALL DEPARTMENTS" : `${selectedDepartment} DEPARTMENT`}
        </h2>
      </div>

      <div className="flex justify-center gap-2 px-8 pb-4 flex-shrink-0 overflow-x-auto">
        {departments.map(dept => (
          <button
            key={dept}
            onClick={() => handleDepartmentClick(dept)}
            disabled={isChangingDepartment}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all whitespace-nowrap ${selectedDepartment === dept
              ? "bg-[#0B2E4F] text-white shadow-lg scale-105"
              : "bg-white text-[#0B2E4F] hover:bg-slate-100 border border-slate-200"
              } ${isChangingDepartment ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {dept}
          </button>
        ))}
      </div>

      <div className="flex-1 px-8 pb-4 min-h-0">
        <div className="overflow-hidden rounded-lg bg-white shadow-sm h-full flex flex-col">
          <div className="overflow-x-auto flex-1">
            <div
              ref={scrollContainerRef}
              className="h-[550px] overflow-y-auto transition-opacity duration-300"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <table className="w-full">
                <thead className="sticky top-0 bg-[#0B2E4F] z-10">
                  <tr className="bg-[#0B2E4F] text-white">
                    <th className="px-4 py-3 text-left text-sm font-semibold w-32">Employee ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name of Official</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Contact Number</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee, index) => {
                    const status = employeeStatuses.get(employee.id) || { status: "Out of Office", remarks: "Unknown" }

                    return (
                      <tr key={employee.id} className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700 font-mono">
                          {employee.employeeId}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{employee.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{employee.contactNumber || "-"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status.status as "In Office" | "On Duty" | "Out of Office" | "On Leave"} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{status.remarks}</td>
                      </tr>
                    )
                  })}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No staff members found in {selectedDepartment} department
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center items-center gap-2">
          <div className="text-xs text-slate-500 text-center">
            <span className="inline-flex items-center gap-2">
              <span className={`animate-pulse ${isChangingDepartment ? 'text-yellow-500' : ''}`}>↻</span>
              {isChangingDepartment ? 'Switching department...' :
                (isAutoScrolling ? 'Auto-scrolling • Hover to pause' : 'Holding for 10 seconds')}
            </span>
          </div>
        </div>
      </div>

      <footer className="mt-auto bg-[#0B2E4F] py-2 flex-shrink-0">
        <div className="flex justify-center items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-white">In Office</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-white">On Duty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-xs text-white">Out of Office</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
            <span className="text-xs text-white">On Leave</span>
          </div>
          <div className="h-4 w-px bg-white/30" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/80">Auto-updating every 30 seconds</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StatusBadge({ status }: { status: "In Office" | "On Duty" | "Out of Office" | "On Leave" }) {
  const styles = {
    "In Office": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "On Duty": "bg-amber-50 text-amber-600 border-amber-200",
    "Out of Office": "bg-red-50 text-red-600 border-red-200",
    "On Leave": "bg-purple-50 text-purple-600 border-purple-200"
  }

  const dotStyles = {
    "In Office": "bg-emerald-500",
    "On Duty": "bg-amber-500",
    "Out of Office": "bg-red-500",
    "On Leave": "bg-purple-500"
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      {status}
    </span>
  )
}