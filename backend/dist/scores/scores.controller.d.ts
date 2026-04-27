import { ScoresService } from './scores.service';
import { UpsertScoreDto } from './dto/upsert-score.dto';
import { UpsertScoresBulkDto } from './dto/upsert-scores-bulk.dto';
export declare class ScoresController {
    private service;
    constructor(service: ScoresService);
    upsert(schoolId: string, dto: UpsertScoreDto): Promise<import("./score.entity").Score | null>;
    upsertBulk(schoolId: string, dto: UpsertScoresBulkDto): Promise<(import("./score.entity").Score | null)[]>;
    byClass(schoolId: string, classId: string, term: string, academicYear: string): Promise<import("./score.entity").Score[]>;
    byStudent(schoolId: string, studentId: string, term: string, academicYear: string): Promise<import("./score.entity").Score[]>;
    bySubject(classId: string, subjectId: string, term: string, academicYear: string): Promise<import("./score.entity").Score[]>;
}
