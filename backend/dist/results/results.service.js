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
exports.ResultsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const class_result_entity_1 = require("./class-result.entity");
const classes_service_1 = require("../classes/classes.service");
const students_service_1 = require("../students/students.service");
const subjects_service_1 = require("../subjects/subjects.service");
const scores_service_1 = require("../scores/scores.service");
const psychometric_service_1 = require("../psychometric/psychometric.service");
const comments_service_1 = require("../comments/comments.service");
const notifications_service_1 = require("../notifications/notifications.service");
const teachers_service_1 = require("../teachers/teachers.service");
const mail_service_1 = require("../mail/mail.service");
const users_service_1 = require("../users/users.service");
let ResultsService = class ResultsService {
    constructor(repo, classes, students, subjects, scores, psychometric, comments, notifications, teachers, mail, users) {
        this.repo = repo;
        this.classes = classes;
        this.students = students;
        this.subjects = subjects;
        this.scores = scores;
        this.psychometric = psychometric;
        this.comments = comments;
        this.notifications = notifications;
        this.teachers = teachers;
        this.mail = mail;
        this.users = users;
    }
    async submit(schoolId, dto, teacherUser) {
        const cls = await this.classes.findOne(schoolId, dto.classId);
        const studentList = await this.students.findByClass(schoolId, dto.classId);
        const subjectList = await this.subjects.findAll(schoolId, dto.classId);
        if (studentList.length === 0)
            throw new common_1.BadRequestException('No students in this class');
        if (subjectList.length === 0)
            throw new common_1.BadRequestException('No subjects in this class');
        const scoreList = await this.scores.findByClass(schoolId, dto.classId, dto.term, dto.academicYear);
        const psychoList = await this.psychometric.findByClass(schoolId, dto.classId, dto.term, dto.academicYear);
        const commentList = await this.comments.findByClass(schoolId, dto.classId, dto.term, dto.academicYear);
        const scoredStudents = new Set(scoreList.map((s) => s.studentId));
        const psychoStudents = new Set(psychoList.map((p) => p.studentId));
        const commentedStudents = new Set(commentList.filter((c) => c.teacherComment).map((c) => c.studentId));
        for (const student of studentList) {
            const studentScores = scoreList.filter((s) => s.studentId === student.id);
            if (studentScores.length < subjectList.length) {
                throw new common_1.BadRequestException(`Incomplete scores for student: ${student.firstName} ${student.lastName}`);
            }
            if (!psychoStudents.has(student.id)) {
                throw new common_1.BadRequestException(`Missing psychometric assessment for: ${student.firstName} ${student.lastName}`);
            }
            if (!commentedStudents.has(student.id)) {
                throw new common_1.BadRequestException(`Missing comment for: ${student.firstName} ${student.lastName}`);
            }
        }
        const existing = await this.repo.findOne({
            where: { classId: dto.classId, term: dto.term, academicYear: dto.academicYear },
        });
        const teacherName = `${teacherUser.firstName} ${teacherUser.lastName}`;
        let result;
        if (existing) {
            if (existing.status === 'approved') {
                throw new common_1.ForbiddenException('Approved results cannot be resubmitted');
            }
            await this.repo.update(existing.id, {
                status: 'submitted',
                submittedAt: new Date(),
                submittedBy: teacherUser.id,
                teacherId: teacherUser.id,
                teacherName,
                rejectionReason: null,
                rejectedAt: null,
                rejectedBy: null,
            });
            result = await this.repo.findOne({ where: { id: existing.id } });
        }
        else {
            result = await this.repo.save(this.repo.create({
                classId: dto.classId,
                className: cls.name,
                schoolId,
                teacherId: teacherUser.id,
                teacherName,
                term: dto.term,
                academicYear: dto.academicYear,
                status: 'submitted',
                submittedAt: new Date(),
                submittedBy: teacherUser.id,
            }));
        }
        await this.notifications.create({
            fromUserId: teacherUser.id,
            fromUserName: teacherName,
            toUserRole: 'school_admin',
            schoolId,
            type: 'result_submitted',
            title: `Results Ready — ${cls.name}`,
            message: `${teacherName} has submitted results for ${cls.name} (${dto.term} term, ${dto.academicYear}).`,
            classId: dto.classId,
            className: cls.name,
            term: dto.term,
            academicYear: dto.academicYear,
        });
        const principals = await this.users.findBySchool(schoolId);
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
        for (const p of principals.filter((u) => u.role === 'school_admin')) {
            this.mail.sendResultSubmittedAlert({
                to: p.email,
                principalName: `${p.firstName} ${p.lastName}`,
                teacherName,
                className: cls.name,
                term: dto.term,
                academicYear: dto.academicYear,
                appUrl: frontendUrl,
                message: dto.message,
            });
        }
        return result;
    }
    findAll(schoolId, status, term, academicYear) {
        const where = { schoolId };
        if (status)
            where.status = status;
        if (term)
            where.term = term;
        if (academicYear)
            where.academicYear = academicYear;
        return this.repo.find({ where, order: { submittedAt: 'DESC' } });
    }
    async findOne(schoolId, classId, term, academicYear) {
        const r = await this.repo.findOne({ where: { classId, schoolId, term: term, academicYear } });
        if (!r)
            throw new common_1.NotFoundException('Result record not found');
        return r;
    }
    async approve(schoolId, id, dto, principalUser) {
        const result = await this.repo.findOne({ where: { id, schoolId } });
        if (!result)
            throw new common_1.NotFoundException('Result not found');
        if (result.status !== 'submitted')
            throw new common_1.BadRequestException('Only submitted results can be approved');
        await this.repo.update(id, {
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: principalUser.id,
            principalNote: dto.principalNote,
        });
        await this.notifications.create({
            fromUserId: principalUser.id,
            fromUserName: `${principalUser.firstName} ${principalUser.lastName}`,
            toUserRole: 'teacher',
            schoolId,
            type: 'result_approved',
            title: `Results Approved — ${result.className}`,
            message: `Your results for ${result.className} (${result.term} term) have been approved.`,
            classId: result.classId,
            className: result.className,
            term: result.term,
            academicYear: result.academicYear,
        });
        const teacher = await this.users.findById(result.teacherId);
        if (teacher) {
            this.mail.sendResultDecisionAlert({
                to: teacher.email,
                teacherName: `${teacher.firstName} ${teacher.lastName}`,
                className: result.className,
                term: result.term,
                decision: 'approved',
                principalNote: dto.principalNote,
                appUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
            });
        }
        return this.repo.findOne({ where: { id } });
    }
    async reject(schoolId, id, dto, principalUser) {
        const result = await this.repo.findOne({ where: { id, schoolId } });
        if (!result)
            throw new common_1.NotFoundException('Result not found');
        if (result.status !== 'submitted')
            throw new common_1.BadRequestException('Only submitted results can be rejected');
        await this.repo.update(id, {
            status: 'rejected',
            rejectedAt: new Date(),
            rejectedBy: principalUser.id,
            rejectionReason: dto.rejectionReason,
        });
        await this.notifications.create({
            fromUserId: principalUser.id,
            fromUserName: `${principalUser.firstName} ${principalUser.lastName}`,
            toUserRole: 'teacher',
            schoolId,
            type: 'result_rejected',
            title: `Results Returned — ${result.className}`,
            message: `Your results for ${result.className} were returned. Reason: ${dto.rejectionReason}`,
            classId: result.classId,
            className: result.className,
            term: result.term,
            academicYear: result.academicYear,
        });
        const teacher = await this.users.findById(result.teacherId);
        if (teacher) {
            this.mail.sendResultDecisionAlert({
                to: teacher.email,
                teacherName: `${teacher.firstName} ${teacher.lastName}`,
                className: result.className,
                term: result.term,
                decision: 'rejected',
                reason: dto.rejectionReason,
                appUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
            });
        }
        return this.repo.findOne({ where: { id } });
    }
    async getComputedResults(schoolId, classId, term, academicYear) {
        const studentList = await this.students.findByClass(schoolId, classId);
        const subjectList = await this.subjects.findAll(schoolId, classId);
        const scoreList = await this.scores.findByClass(schoolId, classId, term, academicYear);
        const psychoList = await this.psychometric.findByClass(schoolId, classId, term, academicYear);
        const commentList = await this.comments.findByClass(schoolId, classId, term, academicYear);
        const studentResults = studentList.map((student) => {
            const studentScores = scoreList.filter((s) => s.studentId === student.id);
            const totalScore = studentScores.reduce((sum, s) => sum + s.total, 0);
            const totalPossible = subjectList.length * 100;
            const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
            return {
                student,
                scores: studentScores,
                psychometricAssessment: psychoList.find((p) => p.studentId === student.id) ?? null,
                comment: commentList.find((c) => c.studentId === student.id) ?? null,
                totalScore,
                totalPossible,
                percentage,
            };
        });
        const sorted = [...studentResults].sort((a, b) => b.percentage - a.percentage);
        const classHighest = sorted[0]?.percentage ?? 0;
        const classAverage = studentResults.length > 0
            ? studentResults.reduce((sum, r) => sum + r.percentage, 0) / studentResults.length
            : 0;
        return studentResults.map((r) => ({
            ...r,
            position: sorted.findIndex((s) => s.student.id === r.student.id) + 1,
            totalStudents: studentList.length,
            classHighest,
            classAverage,
            term,
            academicYear,
        }));
    }
};
exports.ResultsService = ResultsService;
exports.ResultsService = ResultsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(class_result_entity_1.ClassResult)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        classes_service_1.ClassesService,
        students_service_1.StudentsService,
        subjects_service_1.SubjectsService,
        scores_service_1.ScoresService,
        psychometric_service_1.PsychometricService,
        comments_service_1.CommentsService,
        notifications_service_1.NotificationsService,
        teachers_service_1.TeachersService,
        mail_service_1.MailService,
        users_service_1.UsersService])
], ResultsService);
//# sourceMappingURL=results.service.js.map