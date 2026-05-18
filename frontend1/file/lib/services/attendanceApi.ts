// lib/services/attendanceApi.ts
import { request } from "../api-client";

export interface AttendanceStaff {
	staff: {
		id: string;
		employeeId: string;
		name: string;
		email: string;
		contactNo: string;
		cidNo: string;
		officeId: string;
		departmentId: string;
		employmentType: string;
		photo?: string;
		isActive: boolean;
	};
	status: "present" | "absent" | "late" | "leave";
}

export interface DailySummary {
	date: string;
	isHoliday: boolean;
	staff: AttendanceStaff[];
	totalStaff?: number;
	presentCount?: number;
	absentCount?: number;
	leaveCount?: number;
	holidayCount?: number;
}

export async function fetchDailySummary(
	date: string,
	departmentId?: string,
): Promise<DailySummary> {
	let url = `/attendance/daily-summary/${date}`;
	if (departmentId && departmentId !== "all") {
		url += `?departmentId=${departmentId}`;
	}
	return request<DailySummary>(url);
}
