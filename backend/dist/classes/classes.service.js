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
exports.ClassesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const class_entity_1 = require("./class.entity");
let ClassesService = class ClassesService {
    constructor(repo) {
        this.repo = repo;
    }
    create(schoolId, dto) {
        return this.repo.save(this.repo.create({ ...dto, schoolId }));
    }
    findAll(schoolId) {
        return this.repo.find({ where: { schoolId }, order: { name: 'ASC' } });
    }
    async findOne(schoolId, id) {
        const c = await this.repo.findOne({ where: { id, schoolId } });
        if (!c)
            throw new common_1.NotFoundException('Class not found');
        return c;
    }
    async update(schoolId, id, dto) {
        await this.findOne(schoolId, id);
        await this.repo.update(id, dto);
        return this.findOne(schoolId, id);
    }
    async remove(schoolId, id) {
        const c = await this.findOne(schoolId, id);
        await this.repo.remove(c);
    }
    async incrementStudentCount(classId, delta) {
        await this.repo.increment({ id: classId }, 'studentCount', delta);
    }
};
exports.ClassesService = ClassesService;
exports.ClassesService = ClassesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(class_entity_1.Class)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ClassesService);
//# sourceMappingURL=classes.service.js.map