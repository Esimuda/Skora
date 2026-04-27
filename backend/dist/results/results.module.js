"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const class_result_entity_1 = require("./class-result.entity");
const results_service_1 = require("./results.service");
const results_controller_1 = require("./results.controller");
const classes_module_1 = require("../classes/classes.module");
const students_module_1 = require("../students/students.module");
const subjects_module_1 = require("../subjects/subjects.module");
const scores_module_1 = require("../scores/scores.module");
const psychometric_module_1 = require("../psychometric/psychometric.module");
const comments_module_1 = require("../comments/comments.module");
const notifications_module_1 = require("../notifications/notifications.module");
const teachers_module_1 = require("../teachers/teachers.module");
const users_module_1 = require("../users/users.module");
let ResultsModule = class ResultsModule {
};
exports.ResultsModule = ResultsModule;
exports.ResultsModule = ResultsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([class_result_entity_1.ClassResult]),
            classes_module_1.ClassesModule,
            students_module_1.StudentsModule,
            subjects_module_1.SubjectsModule,
            scores_module_1.ScoresModule,
            psychometric_module_1.PsychometricModule,
            comments_module_1.CommentsModule,
            notifications_module_1.NotificationsModule,
            teachers_module_1.TeachersModule,
            users_module_1.UsersModule,
        ],
        providers: [results_service_1.ResultsService],
        controllers: [results_controller_1.ResultsController],
        exports: [results_service_1.ResultsService],
    })
], ResultsModule);
//# sourceMappingURL=results.module.js.map