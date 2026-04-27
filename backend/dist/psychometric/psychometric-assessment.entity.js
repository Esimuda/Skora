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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PsychometricAssessment = void 0;
const typeorm_1 = require("typeorm");
let PsychometricAssessment = class PsychometricAssessment {
};
exports.PsychometricAssessment = PsychometricAssessment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PsychometricAssessment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PsychometricAssessment.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PsychometricAssessment.prototype, "classId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PsychometricAssessment.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PsychometricAssessment.prototype, "term", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PsychometricAssessment.prototype, "academicYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], PsychometricAssessment.prototype, "ratings", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PsychometricAssessment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PsychometricAssessment.prototype, "updatedAt", void 0);
exports.PsychometricAssessment = PsychometricAssessment = __decorate([
    (0, typeorm_1.Entity)('psychometric_assessments'),
    (0, typeorm_1.Unique)(['studentId', 'classId', 'term', 'academicYear'])
], PsychometricAssessment);
//# sourceMappingURL=psychometric-assessment.entity.js.map