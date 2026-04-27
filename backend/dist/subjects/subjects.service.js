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
exports.SubjectsService = exports.UpdateSubjectDto = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subject_entity_1 = require("./subject.entity");
const create_subject_dto_1 = require("./dto/create-subject.dto");
class UpdateSubjectDto extends create_subject_dto_1.CreateSubjectDto {
}
exports.UpdateSubjectDto = UpdateSubjectDto;
let SubjectsService = class SubjectsService {
    constructor(repo) {
        this.repo = repo;
    }
    create(schoolId, classId, dto) {
        return this.repo.save(this.repo.create({ ...dto, classId, schoolId }));
    }
    findAll(schoolId, classId) {
        return this.repo.find({ where: { classId, schoolId }, order: { name: 'ASC' } });
    }
    async findOne(schoolId, id) {
        const s = await this.repo.findOne({ where: { id, schoolId } });
        if (!s)
            throw new common_1.NotFoundException('Subject not found');
        return s;
    }
    async update(schoolId, id, dto) {
        await this.findOne(schoolId, id);
        await this.repo.update(id, dto);
        return this.findOne(schoolId, id);
    }
    async remove(schoolId, id) {
        const s = await this.findOne(schoolId, id);
        await this.repo.remove(s);
    }
};
exports.SubjectsService = SubjectsService;
exports.SubjectsService = SubjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subject_entity_1.Subject)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SubjectsService);
//# sourceMappingURL=subjects.service.js.map