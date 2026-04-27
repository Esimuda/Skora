import { AttendanceService } from './attendance.service';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
export declare class AttendanceController {
    private service;
    constructor(service: AttendanceService);
    upsert(schoolId: string, dto: UpsertAttendanceDto): Promise<import("./attendance.entity").AttendanceRecord | null>;
    byClass(schoolId: string, classId: string, term: string, academicYear: string): Promise<import("./attendance.entity").AttendanceRecord[]>;
    byStudent(schoolId: string, studentId: string, term: string, academicYear: string): Promise<import("./attendance.entity").AttendanceRecord[]>;
}
