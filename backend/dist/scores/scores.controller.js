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
exports.ScoresController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const scores_service_1 = require("./scores.service");
const upsert_score_dto_1 = require("./dto/upsert-score.dto");
const upsert_scores_bulk_dto_1 = require("./dto/upsert-scores-bulk.dto");
let ScoresController = class ScoresController {
    constructor(service) {
        this.service = service;
    }
    upsert(schoolId, dto) {
        return this.service.upsert(schoolId, dto);
    }
    upsertBulk(schoolId, dto) {
        return this.service.upsertBulk(schoolId, dto.scores);
    }
    byClass(schoolId, classId, term, academicYear) {
        return this.service.findByClass(schoolId, classId, term, academicYear);
    }
    byStudent(schoolId, studentId, term, academicYear) {
        return this.service.findByStudent(schoolId, studentId, term, academicYear);
    }
    bySubject(classId, subjectId, term, academicYear) {
        return this.service.findBySubject(classId, subjectId, term, academicYear);
    }
};
exports.ScoresController = ScoresController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upsert_score_dto_1.UpsertScoreDto]),
    __metadata("design:returntype", void 0)
], ScoresController.prototype, "upsert", null);
__decorate([
    (0, common_1.Post)('bulk'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upsert_scores_bulk_dto_1.UpsertScoresBulkDto]),
    __metadata("design:returntype", void 0)
], ScoresController.prototype, "upsertBulk", null);
__decorate([
    (0, common_1.Get)('by-class/:classId'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Param)('classId')),
    __param(2, (0, common_1.Query)('term')),
    __param(3, (0, common_1.Query)('academicYear')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ScoresController.prototype, "byClass", null);
__decorate([
    (0, common_1.Get)('by-student/:studentId'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Query)('term')),
    __param(3, (0, common_1.Query)('academicYear')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ScoresController.prototype, "byStudent", null);
__decorate([
    (0, common_1.Get)('by-subject/:classId/:subjectId'),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Param)('subjectId')),
    __param(2, (0, common_1.Query)('term')),
    __param(3, (0, common_1.Query)('academicYear')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ScoresController.prototype, "bySubject", null);
exports.ScoresController = ScoresController = __decorate([
    (0, swagger_1.ApiTags)('Scores'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('schools/:schoolId/scores'),
    __metadata("design:paramtypes", [scores_service_1.ScoresService])
], ScoresController);
//# sourceMappingURL=scores.controller.js.map