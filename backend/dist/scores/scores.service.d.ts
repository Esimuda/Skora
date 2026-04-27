import { Repository } from 'typeorm';
import { Score } from './score.entity';
import { UpsertScoreDto } from './dto/upsert-score.dto';
export declare class ScoresService {
    private repo;
    constructor(repo: Repository<Score>);
    upsert(schoolId: string, dto: UpsertScoreDto): Promise<Score | null>;
    upsertBulk(schoolId: string, scores: UpsertScoreDto[]): Promise<(Score | null)[]>;
    findByClass(schoolId: string, classId: string, term: string, academicYear: string): Promise<Score[]>;
    findByStudent(schoolId: string, studentId: string, term: string, academicYear: string): Promise<Score[]>;
    findBySubject(classId: string, subjectId: string, term: string, academicYear: string): Promise<Score[]>;
}
