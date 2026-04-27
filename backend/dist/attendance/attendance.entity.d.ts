export declare class AttendanceRecord {
    id: string;
    studentId: string;
    classId: string;
    schoolId: string;
    term: 'first' | 'second' | 'third';
    academicYear: string;
    daysSchoolOpened: number;
    daysPresent: number;
    createdAt: Date;
    updatedAt: Date;
}
