import { Repository } from 'typeorm';
import { PsychometricAssessment } from './psychometric-assessment.entity';
import { UpsertPsychometricDto } from './dto/upsert-psychometric.dto';
export declare const DEFAULT_PSYCHOMETRIC_SKILLS: {
    id: string;
    name: string;
    category: string;
}[];
export declare class PsychometricService {
    private repo;
    constructor(repo: Repository<PsychometricAssessment>);
    getSkills(): {
        id: string;
        name: string;
        category: string;
    }[];
    upsert(schoolId: string, dto: UpsertPsychometricDto): Promise<PsychometricAssessment | null>;
    findByClass(schoolId: string, classId: string, term: string, academicYear: string): Promise<PsychometricAssessment[]>;
    findByStudent(schoolId: string, studentId: string, term: string, academicYear: string): Promise<PsychometricAssessment[]>;
}
