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
exports.PsychometricService = exports.DEFAULT_PSYCHOMETRIC_SKILLS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const psychometric_assessment_entity_1 = require("./psychometric-assessment.entity");
exports.DEFAULT_PSYCHOMETRIC_SKILLS = [
    { id: 'ps1', name: 'Punctuality', category: 'affective' },
    { id: 'ps2', name: 'Attentiveness', category: 'affective' },
    { id: 'ps3', name: 'Obedience', category: 'affective' },
    { id: 'ps4', name: 'Resilience', category: 'affective' },
    { id: 'ps5', name: 'Teamwork', category: 'affective' },
    { id: 'ps6', name: 'Neatness', category: 'affective' },
    { id: 'ps7', name: 'Honesty', category: 'affective' },
    { id: 'ps8', name: 'Leadership', category: 'affective' },
    { id: 'ps9', name: 'Handwriting', category: 'psychomotor' },
    { id: 'ps10', name: 'Drawing/Art', category: 'psychomotor' },
    { id: 'ps11', name: 'Sports/Games', category: 'psychomotor' },
    { id: 'ps12', name: 'Practical Skills', category: 'psychomotor' },
];
let PsychometricService = class PsychometricService {
    constructor(repo) {
        this.repo = repo;
    }
    getSkills() {
        return exports.DEFAULT_PSYCHOMETRIC_SKILLS;
    }
    async upsert(schoolId, dto) {
        const existing = await this.repo.findOne({
            where: { studentId: dto.studentId, classId: dto.classId, term: dto.term, academicYear: dto.academicYear },
        });
        if (existing) {
            await this.repo.update(existing.id, { ratings: dto.ratings });
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
exports.PsychometricService = PsychometricService;
exports.PsychometricService = PsychometricService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(psychometric_assessment_entity_1.PsychometricAssessment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PsychometricService);
//# sourceMappingURL=psychometric.service.js.map