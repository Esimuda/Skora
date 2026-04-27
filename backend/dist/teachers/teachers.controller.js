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
exports.TeachersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const teachers_service_1 = require("./teachers.service");
const invite_teacher_dto_1 = require("./dto/invite-teacher.dto");
const update_teacher_dto_1 = require("./dto/update-teacher.dto");
let TeachersController = class TeachersController {
    constructor(service) {
        this.service = service;
    }
    invite(schoolId, dto, user) {
        return this.service.invite(schoolId, dto, user);
    }
    findAll(schoolId) {
        return this.service.findAll(schoolId);
    }
    findOne(schoolId, id) {
        return this.service.findOne(schoolId, id);
    }
    update(schoolId, id, dto) {
        return this.service.update(schoolId, id, dto);
    }
    activate(schoolId, id) {
        return this.service.activate(schoolId, id);
    }
    deactivate(schoolId, id) {
        return this.service.deactivate(schoolId, id);
    }
    remove(schoolId, id) {
        return this.service.remove(schoolId, id);
    }
};
exports.TeachersController = TeachersController;
__decorate([
    (0, common_1.Post)('invite'),
    (0, roles_decorator_1.Roles)('school_admin', 'admin'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, invite_teacher_dto_1.InviteTeacherDto, Object]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "invite", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('school_admin', 'admin'),
    __param(0, (0, common_1.Param)('schoolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('school_admin', 'admin'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_teacher_dto_1.UpdateTeacherDto]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, roles_decorator_1.Roles)('school_admin', 'admin'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/deactivate'),
    (0, roles_decorator_1.Roles)('school_admin', 'admin'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('school_admin', 'admin'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "remove", null);
exports.TeachersController = TeachersController = __decorate([
    (0, swagger_1.ApiTags)('Teachers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('schools/:schoolId/teachers'),
    __metadata("design:paramtypes", [teachers_service_1.TeachersService])
], TeachersController);
//# sourceMappingURL=teachers.controller.js.map