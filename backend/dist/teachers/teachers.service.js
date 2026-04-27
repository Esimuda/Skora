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
exports.TeachersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const crypto_1 = require("crypto");
const teacher_entity_1 = require("./teacher.entity");
const invite_token_entity_1 = require("./invite-token.entity");
const users_service_1 = require("../users/users.service");
const mail_service_1 = require("../mail/mail.service");
const config_1 = require("@nestjs/config");
let TeachersService = class TeachersService {
    constructor(repo, tokenRepo, users, mail, config) {
        this.repo = repo;
        this.tokenRepo = tokenRepo;
        this.users = users;
        this.mail = mail;
        this.config = config;
    }
    async invite(schoolId, dto, invitedByUser) {
        const existing = await this.users.findByEmail(dto.email);
        if (existing)
            throw new common_1.ConflictException('A user with this email already exists');
        const password = dto.temporaryPassword ?? this.generateTempPassword();
        const hash = await bcrypt.hash(password, 12);
        const user = await this.users.create({
            email: dto.email,
            password: hash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: 'teacher',
            schoolId,
        });
        const teacher = await this.repo.save(this.repo.create({
            userId: user.id,
            schoolId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phoneNumber: dto.phoneNumber,
            classes: [],
            status: 'pending',
        }));
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.tokenRepo.save(this.tokenRepo.create({ token, email: dto.email, schoolId, expiresAt }));
        const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
        const inviteUrl = `${frontendUrl}/accept-invite?token=${token}&email=${encodeURIComponent(dto.email)}`;
        await this.mail.sendTeacherInvite({
            to: dto.email,
            teacherName: `${dto.firstName} ${dto.lastName}`,
            schoolName: invitedByUser.schoolName ?? 'your school',
            principalName: `${invitedByUser.firstName} ${invitedByUser.lastName}`,
            inviteUrl,
            temporaryPassword: password,
        });
        return { teacher, inviteUrl };
    }
    async acceptInvite(token) {
        const invite = await this.tokenRepo.findOne({ where: { token } });
        if (!invite || invite.used)
            throw new common_1.BadRequestException('Invalid or already used invite link');
        if (invite.expiresAt < new Date())
            throw new common_1.BadRequestException('Invite link has expired');
        const teacher = await this.repo.findOne({ where: { email: invite.email, schoolId: invite.schoolId } });
        if (teacher) {
            await this.repo.update(teacher.id, { status: 'active' });
        }
        await this.tokenRepo.update(invite.id, { used: true });
        return { message: 'Invite accepted. You can now log in with your temporary password.' };
    }
    findAll(schoolId) {
        return this.repo.find({ where: { schoolId } });
    }
    async findOne(schoolId, id) {
        const t = await this.repo.findOne({ where: { id, schoolId } });
        if (!t)
            throw new common_1.NotFoundException('Teacher not found');
        return t;
    }
    async update(schoolId, id, dto) {
        await this.findOne(schoolId, id);
        await this.repo.update(id, dto);
        return this.findOne(schoolId, id);
    }
    async activate(schoolId, id) {
        return this.update(schoolId, id, { status: 'active' });
    }
    async deactivate(schoolId, id) {
        return this.update(schoolId, id, { status: 'inactive' });
    }
    async remove(schoolId, id) {
        const t = await this.findOne(schoolId, id);
        await this.repo.remove(t);
    }
    generateTempPassword() {
        return Math.random().toString(36).slice(-8).toUpperCase() + Math.floor(Math.random() * 100);
    }
};
exports.TeachersService = TeachersService;
exports.TeachersService = TeachersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(1, (0, typeorm_1.InjectRepository)(invite_token_entity_1.InviteToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        mail_service_1.MailService,
        config_1.ConfigService])
], TeachersService);
//# sourceMappingURL=teachers.service.js.map