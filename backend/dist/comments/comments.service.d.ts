import { Repository } from 'typeorm';
import { ResultComment } from './comment.entity';
import { UpsertCommentDto } from './dto/upsert-comment.dto';
export declare class CommentsService {
    private repo;
    constructor(repo: Repository<ResultComment>);
    upsert(schoolId: string, dto: UpsertCommentDto): Promise<ResultComment | null>;
    findByClass(schoolId: string, classId: string, term: string, academicYear: string): Promise<ResultComment[]>;
    findByStudent(schoolId: string, studentId: string, term: string, academicYear: string): Promise<ResultComment[]>;
}
