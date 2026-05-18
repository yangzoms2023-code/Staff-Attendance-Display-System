// lib/services/reportApi.ts
import { request } from "../api-client";

export interface AttendanceSummary {
	year: number;
	month: number;
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
	startDate: string;
	endDate: string;
	totalWorkingDays: number;
	holidayCount: number;
	presentCount: number;
	leaveCount: number;
	absentCount: number;
	absentDates: string[];
}

export async function getAttendanceSummary(
	year: number,
	month: number,
	staffId: string,
): Promise<AttendanceSummary> {
	return request<AttendanceSummary>(
		`/attendance/summary/${year}?staffId=${staffId}&month=${month}`,
	);
}
