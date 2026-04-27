"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const schools_module_1 = require("./schools/schools.module");
const teachers_module_1 = require("./teachers/teachers.module");
const classes_module_1 = require("./classes/classes.module");
const students_module_1 = require("./students/students.module");
const subjects_module_1 = require("./subjects/subjects.module");
const scores_module_1 = require("./scores/scores.module");
const psychometric_module_1 = require("./psychometric/psychometric.module");
const attendance_module_1 = require("./attendance/attendance.module");
const comments_module_1 = require("./comments/comments.module");
const results_module_1 = require("./results/results.module");
const notifications_module_1 = require("./notifications/notifications.module");
const messages_module_1 = require("./messages/messages.module");
const mail_module_1 = require("./mail/mail.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST', 'localhost'),
                    port: config.get('DB_PORT', 5432),
                    username: config.get('DB_USERNAME', 'postgres'),
                    password: config.get('DB_PASSWORD', ''),
                    database: config.get('DB_DATABASE', 'skora_rms'),
                    autoLoadEntities: true,
                    synchronize: config.get('NODE_ENV') !== 'production',
                    logging: config.get('NODE_ENV') === 'development',
                }),
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            schools_module_1.SchoolsModule,
            teachers_module_1.TeachersModule,
            classes_module_1.ClassesModule,
            students_module_1.StudentsModule,
            subjects_module_1.SubjectsModule,
            scores_module_1.ScoresModule,
            psychometric_module_1.PsychometricModule,
            attendance_module_1.AttendanceModule,
            comments_module_1.CommentsModule,
            results_module_1.ResultsModule,
            notifications_module_1.NotificationsModule,
            messages_module_1.MessagesModule,
            mail_module_1.MailModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map