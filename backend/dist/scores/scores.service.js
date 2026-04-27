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
exports.ScoresService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const score_entity_1 = require("./score.entity");
const GRADING = [
    { grade: 'A1', min: 75, max: 100, remark: 'Excellent' },
    { grade: 'B2', min: 70, max: 74, remark: 'Very Good' },
    { grade: 'B3', min: 65, max: 69, remark: 'Good' },
    { grade: 'C4', min: 60, max: 64, remark: 'Credit' },
    { grade: 'C5', min: 55, max: 59, remark: 'Credit' },
    { grade: 'C6', min: 50, max: 54, remark: 'Credit' },
    { grade: 'D7', min: 45, max: 49, remark: 'Pass' },
    { grade: 'E8', min: 40, max: 44, remark: 'Pass' },
    { grade: 'F9', min: 0, max: 39, remark: 'Fail' },
];
function gradeFor(total) {
    return GRADING.find((g) => total >= g.min && total <= g.max) ?? GRADING[GRADING.length - 1];
}
let ScoresService = class ScoresService {
    constructor(repo) {
        this.repo = repo;
    }
    async upsert(schoolId, dto) {
        const total = dto.ca1 + dto.ca2 + dto.exam;
        const { grade, remark } = gradeFor(total);
        const existing = await this.repo.findOne({
            where: { studentId: dto.studentId, subjectId: dto.subjectId, term: dto.term, academicYear: dto.academicYear },
        });
        if (existing) {
            await this.repo.update(existing.id, { ca1: dto.ca1, ca2: dto.ca2, exam: dto.exam, total, grade, remark });
            return this.repo.findOne({ where: { id: existing.id } });
        }
        return this.repo.save(this.repo.create({ ...dto, schoolId, total, grade, remark }));
    }
    async upsertBulk(schoolId, scores) {
        return Promise.all(scores.map((s) => this.upsert(schoolId, s)));
    }
    findByClass(schoolId, classId, term, academicYear) {
        return this.repo.find({ where: { classId, schoolId, term: term, academicYear } });
    }
    findByStudent(schoolId, studentId, term, academicYear) {
        return this.repo.find({ where: { studentId, schoolId, term: term, academicYear } });
    }
    findBySubject(classId, subjectId, term, academicYear) {
        return this.repo.find({ where: { classId, subjectId, term: term, academicYear } });
    }
};
exports.ScoresService = ScoresService;
exports.ScoresService = ScoresService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(score_entity_1.Score)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ScoresService);
//# sourceMappingURL=scores.service.js.map