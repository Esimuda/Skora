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
exports.ResultsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const results_service_1 = require("./results.service");
const submit_result_dto_1 = require("./dto/submit-result.dto");
const approve_result_dto_1 = require("./dto/approve-result.dto");
const reject_result_dto_1 = require("./dto/reject-result.dto");
let ResultsController = class ResultsController {
    constructor(service) {
        this.service = service;
    }
    submit(schoolId, dto, user) {
        return this.service.submit(schoolId, dto, user);
    }
    findAll(schoolId, status, term, academicYear) {
        return this.service.findAll(schoolId, status, term, academicYear);
    }
    findOne(schoolId, classId, term, academicYear) {
        return this.service.findOne(schoolId, classId, term, academicYear);
    }
    computed(schoolId, classId, term, academicYear) {
        return this.service.getComputedResults(schoolId, classId, term, academicYear);
    }
    approve(schoolId, id, dto, user) {
        return this.service.approve(schoolId, id, dto, user);
    }
    reject(schoolId, id, dto, user) {
        return this.service.reject(schoolId, id, dto, user);
    }
};
exports.ResultsController = ResultsController;
__decorate([
    (0, common_1.Post)('submit'),
    (0, roles_decorator_1.Roles)('teacher'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_result_dto_1.SubmitResultDto, Object]),
    __metadata("design:returntype", void 0)
], ResultsController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('school_admin', 'admin'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('term')),
    __param(3, (0, common_1.Query)('academicYear')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ResultsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':classId/status'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Param)('classId')),
    __param(2, (0, common_1.Query)('term')),
    __param(3, (0, common_1.Query)('academicYear')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ResultsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':classId/computed'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Param)('classId')),
    __param(2, (0, common_1.Query)('term')),
    __param(3, (0, common_1.Query)('academicYear')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ResultsController.prototype, "computed", null);
__decorate([
    (0, common_1.Put)(':id/approve'),
    (0, roles_decorator_1.Roles)('school_admin', 'admin'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, approve_result_dto_1.ApproveResultDto, Object]),
    __metadata("design:returntype", void 0)
], ResultsController.prototype, "approve", null);
__decorate([
    (0, common_1.Put)(':id/reject'),
    (0, roles_decorator_1.Roles)('school_admin', 'admin'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, reject_result_dto_1.RejectResultDto, Object]),
    __metadata("design:returntype", void 0)
], ResultsController.prototype, "reject", null);
exports.ResultsController = ResultsController = __decorate([
    (0, swagger_1.ApiTags)('Results'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('schools/:schoolId/results'),
    __metadata("design:paramtypes", [results_service_1.ResultsService])
], ResultsController);
//# sourceMappingURL=results.controller.js.map