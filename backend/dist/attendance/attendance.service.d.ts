import { Repository } from 'typeorm';
import { AttendanceRecord } from './attendance.entity';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
export declare class AttendanceService {
    private repo;
    constructor(repo: Repository<AttendanceRecord>);
    upsert(schoolId: string, dto: UpsertAttendanceDto): Promise<AttendanceRecord | null>;
    findByClass(schoolId: string, classId: string, term: string, academicYear: string): Promise<AttendanceRecord[]>;
    findByStudent(schoolId: string, studentId: string, term: string, academicYear: string): Promise<AttendanceRecord[]>;
}
