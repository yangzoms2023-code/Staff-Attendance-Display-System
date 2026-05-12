"use client"

import { useState, useEffect, useRef } from "react"
import { dataStore } from "@/lib/data-store"
import type { Employee, AttendanceRecord, LeaveRequest } from "@/lib/types"
import { BackgroundPattern } from '@/components/background-pattern'

// Bhutanese Proverbs
const PROVERBS = [
  { text: "Individual success depends on success as a nation – no one succeeds when the nation has failed.", author: "Jigme Khesar Namgyel Wangchuck" },
  { text: "Our size is our greatest strength.", author: "Jigme Khesar Namgyel Wangchuck" },
  { text: "Rise to the challenge, change our mindset, think big and work hard.", author: "Jigme Khesar Namgyel Wangchuck" },
  { text: "We cannot change the past, but we can shape the future.", author: "Jigme Khesar Namgyel Wangchuck" },
  { text: "The strength of a nation lies in its people, their dreams, and their determination.", author: "Jigme Khesar Namgyel Wangchuck" },
  { text: "We cannot afford to be timid, avoid what we don’t yet understand and hope for the best. Such an attitude will cost us our national objective of self-reliance.", author: "Jigme Khesar Namgyel Wangchuck" },
]

export default function TVDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map())
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [employeeStatuses, setEmployeeStatuses] = useState<Map<string, { status: string; remarks: string }>>(new Map())
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [currentProverbIndex, setCurrentProverbIndex] = useState(0)
  const [quoteFade, setQuoteFade] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const today = new Date().toISOString().split("T")[0]

  // Group employees by department
  const groupedEmployees = employees.reduce((acc, employee) => {
    const dept = employee.department
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(employee)
    return acc
  }, {} as Record<string, Employee[]>)

  // Fix hydration by setting client-side only after mount
  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
  }, [])

  // Update time every second (only on client)
  useEffect(() => {
    if (!isClient) return
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [isClient])

  // Rotate quotes with fade effect
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteFade(false)
      setTimeout(() => {
        setCurrentProverbIndex((prev) => (prev + 1) % PROVERBS.length)
        setQuoteFade(true)
      }, 500)
    }, 8000)
    return () => clearInterval(quoteInterval)
  }, [])

  // Auto-scroll functionality
  useEffect(() => {
    if (!isClient || employees.length === 0) return
    
    const startAutoScroll = () => {
      if (!scrollContainerRef.current) return
      
      const scrollContainer = scrollContainerRef.current
      let scrollAmount = 0
      const scrollStep = 1.5
      const scrollInterval = 30

      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current)

      const totalScrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight

      if (totalScrollHeight <= 0) return

      scrollIntervalRef.current = setInterval(() => {
        if (scrollContainer) {
          scrollAmount += scrollStep
          
          if (scrollAmount >= totalScrollHeight) {
            scrollContainer.scrollTop = 0
            scrollAmount = 0
          } else {
            scrollContainer.scrollTop = scrollAmount
          }
        }
      }, scrollInterval)
    }

    setTimeout(startAutoScroll, 1000)

    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current)
    }
  }, [isClient, employees])

  // Load data
  useEffect(() => {
    if (!isClient) return
    
    dataStore.init()
    loadData()

    const refreshInterval = setInterval(loadData, 30000)
    return () => clearInterval(refreshInterval)
  }, [isClient])

  const loadData = () => {
    const emps = dataStore.getEmployees().filter(e => e.status === "Active")
    setEmployees(emps)

    const attendance = dataStore.getAttendance()
    const attendanceMap = new Map<string, AttendanceRecord>()
    attendance.forEach(record => {
      if (record.date === today) {
        attendanceMap.set(record.employeeId, record)
      }
    })
    setAttendanceRecords(attendanceMap)

    const leaves = dataStore.getLeaveRequests()

    // Build statuses with remarks
    const statuses = new Map()
    emps.forEach(emp => {
      const activeLeave = leaves.find(l =>
        l.employeeId === emp.id && l.startDate <= today && l.endDate >= today
      )

      if (activeLeave) {
        const start = new Date(activeLeave.startDate).toLocaleDateString()
        const end = new Date(activeLeave.endDate).toLocaleDateString()
        statuses.set(emp.id, {
          status: "On Leave",
          remarks: `Leave from ${start} to ${end}`
        })
      } else {
        const attendanceRecord = attendanceMap.get(emp.id)
        if (!attendanceRecord) {
          statuses.set(emp.id, {
            status: "Absent",
            remarks: "Not checked in today"
          })
        } else if (attendanceRecord.status === "Late") {
          statuses.set(emp.id, {
            status: "Late",
            remarks: `Arrived at ${attendanceRecord.checkIn}`
          })
        } else if (attendanceRecord.status === "Present") {
          statuses.set(emp.id, {
            status: "Present",
            remarks: `Checked in at ${attendanceRecord.checkIn}`
          })
        } else {
          statuses.set(emp.id, {
            status: attendanceRecord.status,
            remarks: attendanceRecord.remarks || "On time"
          })
        }
      }
    })
    setEmployeeStatuses(statuses)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).toUpperCase()
  }

  const getEmployeeStatusBadge = (employee: Employee): { status: string; time: string; badgeClass: string } => {
    const status = employeeStatuses.get(employee.id)
    
    if (status?.status === "On Leave") {
      return { 
        status: "On Leave", 
        time: "-", 
        badgeClass: "bg-purple-800 text-white border-purple-400/50"
      }
    }
    
    if (status?.status === "Late") {
      const time = status.remarks?.match(/\d{1,2}:\d{2}/)?.[0] || "-"
      return { 
        status: "Late", 
        time: time,
        badgeClass: "bg-amber-800 text-amber-300 border-amber-400/50"
      }
    }
    
    if (status?.status === "Present") {
      const time = status.remarks?.match(/\d{1,2}:\d{2}/)?.[0] || "-"
      return { 
        status: "Present", 
        time: time,
        badgeClass: "bg-emerald-800 text-white border-emerald-400/50"
      }
    }
    
    return { 
      status: "Absent", 
      time: "-",
      badgeClass: "bg-red-800 text-white border-red-400/50"
    }
  }

  // Don't render until client-side to prevent hydration mismatch
  if (!isClient || !currentTime) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <BackgroundPattern />
        <div className="flex items-center justify-center h-screen relative z-10">
          <div className="text-3xl text-cyan-400 animate-pulse">Loading Display...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundPattern />
      
      {/* Main Content - Optimized for 1080×1920 */}
      <div className="relative z-10 flex flex-col h-screen p-8">
        
        {/* ===== HEADER SECTION (15%) ===== */}
        <div className="flex-shrink-0 mb-8">
          <div className="flex justify-between items-start">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <img src="/icon.png" alt="Logo" className="h-30 w-30 object-contain" />
              <div>
                <h1 className="text-4xl font-bold text-[#0B2E4F] tracking-tight">
                  Staff Information Display
                </h1>
                <p className="text-2xl text-slate-700 font-semibold mt-1">
                  Thimphu Dzongkhag Administration
                </p>
              </div>
            </div>

            {/* Date and Time */}
            <div className="text-right">
              <div className="text-4xl font-black tabular-nums text-[#0B2E4F]">
                {formatTime(currentTime)}
              </div>
              <div className="text-xl font-bold text-[#0B2E4F] mt-3 tracking-wide">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>
          
          {/* Elegant Divider */}
          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-[#0B2E4F]/50 to-transparent" />
        </div>

        {/* ===== MAIN ATTENDANCE SECTION (70%) ===== */}
        <div className="flex-1 min-h-0 mb-8">
          <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto hide-scrollbar"
          >
            <div className="space-y-8 pb-6">
              {Object.entries(groupedEmployees).map(([department, deptEmployees]) => (
                <div 
                  key={department}
                  className="animate-fadeIn"
                  style={{ animationDuration: '0.6s' }}
                >
                  {/* Department Header */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-1.5 h-12 bg-gradient-to-b from-[#0B2E4F] to-[#1a5a92] rounded-full" />
                    <h2 className="text-3xl font-bold text-[#0B2E4F] tracking-wider">
                      {department.toUpperCase()}
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#0B2E4F]/30 to-transparent" />
                    <div className="text-2xl font-bold text-slate-400">{deptEmployees.length}</div>
                  </div>

                  {/* Employee Cards - Redesigned with remarks section */}
                  <div className="space-y-4">
                    {deptEmployees.map((employee, idx) => {
                      const { status, time, badgeClass } = getEmployeeStatusBadge(employee)
                      const statusData = employeeStatuses.get(employee.id)
                      const remarks = statusData?.remarks || "No additional information"
                      
                      return (
                        <div
                          key={employee.id}
                          className="group relative overflow-hidden rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200 hover:border-cyan-500/70 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20"
                          style={{
                            animation: `slideIn 0.4s ease-out ${idx * 0.03}s both`
                          }}
                        >
                          {/* Main row - Avatar + Info + Status */}
                          <div className="relative px-6 pt-4 pb-3 flex items-center gap-6">
                            {/* Avatar - Fixed width, maintain left position */}
                            <div className="flex-shrink-0">
                              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#0B2E4F] to-[#1a5a92] flex items-center justify-center shadow-lg">
                                <span className="text-3xl font-bold text-white">
                                  {employee.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Employee Info Row - Horizontal layout with proper spacing */}
                            <div className="flex-1 flex items-center gap-8 min-w-0">
                              {/* Name - with marquee for long names */}
                              <div className="min-w-[180px] max-w-[260px]">
                                <div className="relative overflow-hidden group/name">
                                  <h3 className="text-xl font-bold text-black tracking-tight whitespace-nowrap hover:animate-marquee">
                                    {employee.name}
                                  </h3>
                                </div>
                              </div>
                              
                              {/* Designation - with marquee for long titles */}
                              <div className="min-w-[180px] max-w-[240px]">
                                <div className="relative overflow-hidden group/designation">
                                  <p className="text-lg text-slate-700 whitespace-nowrap hover:animate-marquee">
                                    {employee.designation}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Contact Number */}
                              <div className="flex items-center gap-2 min-w-[160px]">
                                <span className="text-xl text-[#0B2E4F]">📞</span>
                                <span className="text-xl text-[#0B2E4F] font-bold tracking-wide">
                                  {employee.contactNumber || "—"}
                                </span>
                              </div>
                            </div>

                            {/* Status Badge - Highly visible on right side */}
                            <div className="flex-shrink-0">
                              <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-sm shadow-md ${badgeClass}`}>
                                <div className="flex items-center gap-2">
                                  {/* Status indicator dot */}
                                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                                    status === "Present" ? "bg-emerald-400" :
                                    status === "Late" ? "bg-amber-400" :
                                    status === "On Leave" ? "bg-purple-400" :
                                    "bg-red-400"
                                  }`} />
                                  <div className="text-right">
                                    <div className="text-xl font-bold leading-tight">
                                      {status}
                                    </div>
                                    {time !== "-" && (
                                      <div className="text-xs text-slate-200 mt-0.5">
                                        ⏱️ {time}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Remarks Section - Below the main row, neatly integrated */}
                          <div className="relative px-6 pb-4 pt-1">
                            <div className="flex items-center gap-3 bg-slate-50/80 rounded-lg px-4 py-2.5 border-l-4 border-l-[#0B2E4F]">
                              <div className="flex-shrink-0">
                                <span className="text-base text-slate-500">💬</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-base text-slate-700 font-medium">
                                  {remarks}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              
              {employees.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4"></div>
                  <p className="text-2xl text-black">Loading staff data...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== QUOTE SECTION ===== */}
        <div className="flex-shrink-0 space-y-4">
          {/* Rotating Quote */}
          <div className={`relative overflow-hidden rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-600/50 p-6 transition-opacity duration-500 ${quoteFade ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl" />
            <div className="relative flex items-center gap-5">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-[#0B2E4F] flex items-center justify-center shadow-lg shadow-gray-200/20">
                  <span className="text-3xl">💬</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-medium text-white leading-relaxed">
                  "{PROVERBS[currentProverbIndex].text}"
                </p>
                <p className="text-base text-gray-100 mt-2 font-medium">
                  — {PROVERBS[currentProverbIndex].author}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-marquee {
          animation: marquee 8s linear infinite;
          display: inline-block;
          padding-left: 100%;
        }
        
        .animate-fadeIn {
          animation: fadeIn 2s ease-out forwards;
        }

        /* Hover-based marquee for better UX */
        .group\/name:hover .whitespace-nowrap,
        .group\/designation:hover .whitespace-nowrap {
          animation: marquee 6s linear infinite;
        }
      `}</style>
    </div>
  )
}