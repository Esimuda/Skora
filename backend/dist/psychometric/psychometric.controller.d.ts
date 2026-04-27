import { PsychometricService } from './psychometric.service';
import { UpsertPsychometricDto } from './dto/upsert-psychometric.dto';
export declare class PsychometricController {
    private service;
    constructor(service: PsychometricService);
    getSkills(): {
        id: string;
        name: string;
        category: string;
    }[];
    upsert(schoolId: string, dto: UpsertPsychometricDto): Promise<import("./psychometric-assessment.entity").PsychometricAssessment | null>;
    byClass(schoolId: string, classId: string, term: string, academicYear: string): Promise<import("./psychometric-assessment.entity").PsychometricAssessment[]>;
    byStudent(schoolId: string, studentId: string, term: string, academicYear: string): Promise<import("./psychometric-assessment.entity").PsychometricAssessment[]>;
}
