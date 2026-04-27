import { ResultsService } from './results.service';
import { SubmitResultDto } from './dto/submit-result.dto';
import { ApproveResultDto } from './dto/approve-result.dto';
import { RejectResultDto } from './dto/reject-result.dto';
export declare class ResultsController {
    private service;
    constructor(service: ResultsService);
    submit(schoolId: string, dto: SubmitResultDto, user: any): Promise<import("./class-result.entity").ClassResult>;
    findAll(schoolId: string, status?: string, term?: string, academicYear?: string): Promise<import("./class-result.entity").ClassResult[]>;
    findOne(schoolId: string, classId: string, term: string, academicYear: string): Promise<import("./class-result.entity").ClassResult>;
    computed(schoolId: string, classId: string, term: string, academicYear: string): Promise<{
        position: number;
        totalStudents: number;
        classHighest: number;
        classAverage: number;
        term: string;
        academicYear: string;
        student: import("../students/student.entity").Student;
        scores: import("../scores/score.entity").Score[];
        psychometricAssessment: import("../psychometric/psychometric-assessment.entity").PsychometricAssessment | null;
        comment: import("../comments/comment.entity").ResultComment | null;
        totalScore: number;
        totalPossible: number;
        percentage: number;
    }[]>;
    approve(schoolId: string, id: string, dto: ApproveResultDto, user: any): Promise<import("./class-result.entity").ClassResult | null>;
    reject(schoolId: string, id: string, dto: RejectResultDto, user: any): Promise<import("./class-result.entity").ClassResult | null>;
}
