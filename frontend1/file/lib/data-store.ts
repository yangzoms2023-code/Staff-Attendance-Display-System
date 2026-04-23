import type { Employee, AttendanceRecord, User, DailyStats, OutingRequest } from "./types"

// Sample departments for Thimphu Dzongkhag Administration
export const DEPARTMENTS = [
  "Administration",
  "Finance",
  "Human Resources",
  "Planning",
  "Engineering",
  "Agriculture",
  "Education",
  "Health",
  "Environment",
  "ICT"
]

// Sample designations
export const DESIGNATIONS = [
  "Dzongdag",
  "Dzongrab",
  "Administrative Officer",
  "Finance Officer",
  "Planning Officer",
  "Engineer",
  "Accountant",
  "HR Officer",
  "IT Officer",
  "Driver",
  "Office Assistant",
  "Receptionist"
]

// Default admin user
const DEFAULT_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "System Administrator",
    email: "admin@thimphu.gov.bt"
  },
  {
    id: "2",
    username: "operator",
    password: "operator123",
    role: "operator",
    name: "Front Desk Operator",
    email: "operator@thimphu.gov.bt"
  },
  {
    id: "102",
    username: "pema.wangmo",
    password: "1234",
    role: "employee",
    name: "Pema Wangmoo",
    email: "pema.wangmo@thimphu.gov.bt",
    employeeId: "TDA002",
    department: "Finance"
  }
]

// Sample employees
const SAMPLE_EMPLOYEES: Employee[] = [
  {
    id: "1",
    employeeId: "TDA001",
    name: "Tshering Dorji",
    gender: "Male",
    designation: "Dzongdag",
    contactNumber: "17123456",
    email: "tshering.dorji@thimphu.gov.bt",
    address: "Thimphu, Bhutan",
    department: "Administration",
    joiningDate: "2020-01-15",
    status: "Active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    employeeId: "TDA002",
    name: "Pema Wangmo",
    gender: "Female",
    designation: "Finance Officer",
    contactNumber: "17234567",
    email: "pema.wangmo@thimphu.gov.bt",
    address: "Thimphu, Bhutan",
    department: "Finance",
    joiningDate: "2021-03-20",
    status: "Active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "3",
    employeeId: "TDA003",
    name: "Karma Tenzin",
    gender: "Male",
    designation: "IT Officer",
    contactNumber: "17345678",
    email: "karma.tenzin@thimphu.gov.bt",
    address: "Thimphu, Bhutan",
    department: "ICT",
    joiningDate: "2022-06-01",
    status: "Active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "4",
    employeeId: "TDA004",
    name: "Sonam Deki",
    gender: "Female",
    designation: "HR Officer",
    contactNumber: "17456789",
    email: "sonam.deki@thimphu.gov.bt",
    address: "Thimphu, Bhutan",
    department: "Human Resources",
    joiningDate: "2021-09-15",
    status: "Active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "5",
    employeeId: "TDA005",
    name: "Dorji Wangchuk",
    gender: "Male",
    designation: "Engineer",
    contactNumber: "17567890",
    email: "dorji.wangchuk@thimphu.gov.bt",
    address: "Thimphu, Bhutan",
    department: "Engineering",
    joiningDate: "2020-11-01",
    status: "Active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "6",
    employeeId: "TDA006",
    name: "Dechen Yangzom",
    gender: "Female",
    designation: "Planning Officer",
    contactNumber: "17678901",
    email: "dechen.yangzom@thimphu.gov.bt",
    address: "Thimphu, Bhutan",
    department: "Planning",
    joiningDate: "2023-02-01",
    status: "Active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "7",
    employeeId: "TDA007",
    name: "Kinley Namgay",
    gender: "Male",
    designation: "Accountant",
    contactNumber: "17789012",
    email: "kinley.namgay@thimphu.gov.bt",
    address: "Thimphu, Bhutan",
    department: "Finance",
    joiningDate: "2022-04-15",
    status: "Active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "8",
    employeeId: "TDA008",
    name: "Chimi Dema",
    gender: "Female",
    designation: "Receptionist",
    contactNumber: "17890123",
    email: "chimi.dema@thimphu.gov.bt",
    address: "Thimphu, Bhutan",
    department: "Administration",
    joiningDate: "2023-07-01",
    status: "Active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "9",
    employeeId: "TDA009",
    name: "Ugyen Tshomo",
    gender: "Female",
    designation: "Administrative Officer",
    contactNumber: "17901234",
    email: "ugyen.tshomo@thimphu.gov.bt",
    address: "Thimphu, Bhutan",
    department: "Administration",
    joiningDate: "2021-01-10",
    status: "Active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "10",
    employeeId: "TDA010",
    name: "Sangay Dorji",
    gender: "Male",
    designation: "Driver",
    contactNumber: "17012345",
    email: "sangay.dorji@thimphu.gov.bt",
    address: "Thimphu, Bhutan",
    department: "Administration",
    joiningDate: "2019-05-20",
    status: "Active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  }
]

// Generate attendance records for the last 30 days
function generateSampleAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const today = new Date()
  
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)
    const dateStr = date.toISOString().split("T")[0]
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue
    
    SAMPLE_EMPLOYEES.forEach((emp, empIndex) => {
      const random = Math.random()
      let status: AttendanceRecord["status"] = "Present"
      let checkIn: string | null = null
      let checkOut: string | null = null
      let remarks = ""
      
      if (random < 0.7) {
        status = "Present"
        checkIn = `0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`
        checkOut = `1${6 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`
      } else if (random < 0.8) {
        status = "Late"
        checkIn = `${9 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`
        checkOut = `1${7 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`
        remarks = "Arrived late"
      } else if (random < 0.9) {
        status = "Absent"
        remarks = "Did not report"
      } else {
        status = "Leave"
        remarks = "On approved leave"
      }
      
      records.push({
        id: `att-${dayOffset}-${empIndex}`,
        employeeId: emp.id,
        date: dateStr,
        checkIn,
        checkOut,
        status,
        remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    })
  }
  
  return records
}

// Storage keys
const STORAGE_KEYS = {
  EMPLOYEES: "tda_employees",
  ATTENDANCE: "tda_attendance",
  USERS: "tda_users",
  OUTING_REQUESTS: "tda_outing_requests"
}

// Data store functions
export const dataStore = {
  // Initialize data
  init() {
    if (typeof window === "undefined") return
    
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS))
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(SAMPLE_EMPLOYEES))
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(generateSampleAttendance()))
    }
  },
  
  // Users
  getUsers(): User[] {
    if (typeof window === "undefined") return DEFAULT_USERS
    const data = localStorage.getItem(STORAGE_KEYS.USERS)
    return data ? JSON.parse(data) : DEFAULT_USERS
  },
  
  validateUser(username: string, password: string): User | null {
    const users = this.getUsers()
    return users.find(u => u.username === username && u.password === password) || null
  },
  
  // Employees
  getEmployees(): Employee[] {
    if (typeof window === "undefined") return SAMPLE_EMPLOYEES
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES)
    return data ? JSON.parse(data) : SAMPLE_EMPLOYEES
  },
  
  getEmployeeById(id: string): Employee | undefined {
    return this.getEmployees().find(e => e.id === id)
  },
  
  addEmployee(employee: Omit<Employee, "id" | "createdAt" | "updatedAt">): Employee {
    const employees = this.getEmployees()
    const newEmployee: Employee = {
      ...employee,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    employees.push(newEmployee)
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees))
    return newEmployee
  },
  
  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const employees = this.getEmployees()
    const index = employees.findIndex(e => e.id === id)
    if (index === -1) return null
    
    employees[index] = {
      ...employees[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees))
    return employees[index]
  },
  
  deleteEmployee(id: string): boolean {
    const employees = this.getEmployees()
    const filtered = employees.filter(e => e.id !== id)
    if (filtered.length === employees.length) return false
    
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filtered))
    return true
  },
  
  // Attendance
  getAttendance(): AttendanceRecord[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE)
    return data ? JSON.parse(data) : []
  },
  
  getAttendanceByDate(date: string): AttendanceRecord[] {
    return this.getAttendance().filter(a => a.date === date)
  },
  
  getAttendanceByEmployee(employeeId: string): AttendanceRecord[] {
    return this.getAttendance().filter(a => a.employeeId === employeeId)
  },
  
  markAttendance(record: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt">): AttendanceRecord {
    const attendance = this.getAttendance()
    
    // Check if record already exists for this employee on this date
    const existingIndex = attendance.findIndex(
      a => a.employeeId === record.employeeId && a.date === record.date
    )
    
    const newRecord: AttendanceRecord = {
      ...record,
      id: existingIndex >= 0 ? attendance[existingIndex].id : String(Date.now()),
      createdAt: existingIndex >= 0 ? attendance[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    if (existingIndex >= 0) {
      attendance[existingIndex] = newRecord
    } else {
      attendance.push(newRecord)
    }
    
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance))
    return newRecord
  },
  
  getDailyStats(date: string): DailyStats {
    const employees = this.getEmployees().filter(e => e.status === "Active")
    const attendance = this.getAttendanceByDate(date)
    
    const stats: DailyStats = {
      date,
      totalEmployees: employees.length,
      present: 0,
      absent: 0,
      late: 0,
      onLeave: 0
    }
    
    const recordedEmployees = new Set<string>()
    
    attendance.forEach(record => {
      recordedEmployees.add(record.employeeId)
      switch (record.status) {
        case "Present":
          stats.present++
          break
        case "Late":
          stats.late++
          stats.present++ // Late is also present
          break
        case "Leave":
          stats.onLeave++
          break
        case "Absent":
          stats.absent++
          break
      }
    })
    
    // Employees without records are considered absent
    stats.absent = employees.length - stats.present - stats.onLeave
    
    return stats
  },

  // Outing Requests
  getOutingRequests(): OutingRequest[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.OUTING_REQUESTS)
    return data ? JSON.parse(data) : []
  },

  getOutingRequestsByDate(date: string): OutingRequest[] {
    return this.getOutingRequests().filter(r => r.date === date)
  },

  getOutingRequestsByEmployee(employeeId: string): OutingRequest[] {
    return this.getOutingRequests().filter(r => r.employeeId === employeeId)
  },

  getPendingOutingRequests(): OutingRequest[] {
    return this.getOutingRequests().filter(r => r.status === "pending")
  },

  getTodayOutingRequests(): OutingRequest[] {
    const today = new Date().toISOString().split("T")[0]
    return this.getOutingRequestsByDate(today)
  },

  createOutingRequest(request: Omit<OutingRequest, "id" | "status" | "reviewedBy" | "reviewedAt" | "reviewerRemarks" | "actualReturnTime" | "createdAt" | "updatedAt">): OutingRequest {
    const requests = this.getOutingRequests()
    const newRequest: OutingRequest = {
      ...request,
      id: String(Date.now()),
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      reviewerRemarks: "",
      actualReturnTime: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    requests.push(newRequest)
    localStorage.setItem(STORAGE_KEYS.OUTING_REQUESTS, JSON.stringify(requests))
    return newRequest
  },

  reviewOutingRequest(
    requestId: string, 
    decision: "approved" | "denied", 
    reviewerId: string, 
    remarks: string = ""
  ): OutingRequest | null {
    const requests = this.getOutingRequests()
    const index = requests.findIndex(r => r.id === requestId)
    if (index === -1) return null

    requests[index] = {
      ...requests[index],
      status: decision,
      reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
      reviewerRemarks: remarks,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEYS.OUTING_REQUESTS, JSON.stringify(requests))
    return requests[index]
  },

  markOutingReturn(requestId: string): OutingRequest | null {
    const requests = this.getOutingRequests()
    const index = requests.findIndex(r => r.id === requestId)
    if (index === -1) return null

    const now = new Date()
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")

    requests[index] = {
      ...requests[index],
      actualReturnTime: `${hours}:${minutes}`,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEYS.OUTING_REQUESTS, JSON.stringify(requests))
    return requests[index]
  }
}
