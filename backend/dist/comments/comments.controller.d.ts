import { CommentsService } from './comments.service';
import { UpsertCommentDto } from './dto/upsert-comment.dto';
export declare class CommentsController {
    private service;
    constructor(service: CommentsService);
    upsert(schoolId: string, dto: UpsertCommentDto): Promise<import("./comment.entity").ResultComment | null>;
    byClass(schoolId: string, classId: string, term: string, academicYear: string): Promise<import("./comment.entity").ResultComment[]>;
    byStudent(schoolId: string, studentId: string, term: string, academicYear: string): Promise<import("./comment.entity").ResultComment[]>;
}
