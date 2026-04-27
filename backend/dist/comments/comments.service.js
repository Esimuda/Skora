"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const comment_entity_1 = require("./comment.entity");
let CommentsService = class CommentsService {
    constructor(repo) {
        this.repo = repo;
    }
    async upsert(schoolId, dto) {
        const existing = await this.repo.findOne({
            where: { studentId: dto.studentId, classId: dto.classId, term: dto.term, academicYear: dto.academicYear },
        });
        if (existing) {
            const update = {};
            if (dto.teacherComment !== undefined)
                update.teacherComment = dto.teacherComment;
            if (dto.principalComment !== undefined)
                update.principalComment = dto.principalComment;
            await this.repo.update(existing.id, update);
            return this.repo.findOne({ where: { id: existing.id } });
        }
        return this.repo.save(this.repo.create({ ...dto, schoolId }));
    }
    findByClass(schoolId, classId, term, academicYear) {
        return this.repo.find({ where: { classId, schoolId, term: term, academicYear } });
    }
    findByStudent(schoolId, studentId, term, academicYear) {
        return this.repo.find({ where: { studentId, schoolId, term: term, academicYear } });
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(comment_entity_1.ResultComment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CommentsService);
//# sourceMappingURL=comments.service.js.map