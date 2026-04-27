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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const message_entity_1 = require("./message.entity");
const users_service_1 = require("../users/users.service");
let MessagesService = class MessagesService {
    constructor(repo, users) {
        this.repo = repo;
        this.users = users;
    }
    async send(schoolId, sender, dto) {
        const recipient = await this.users.findById(dto.recipientId);
        if (!recipient)
            throw new common_1.NotFoundException('Recipient not found');
        return this.repo.save(this.repo.create({
            schoolId,
            senderId: sender.id,
            senderName: `${sender.firstName} ${sender.lastName}`,
            senderRole: sender.role,
            recipientId: dto.recipientId,
            recipientName: `${recipient.firstName} ${recipient.lastName}`,
            recipientRole: recipient.role,
            content: dto.content,
            classId: dto.classId,
            className: dto.className,
        }));
    }
    getConversation(schoolId, userId, otherId) {
        return this.repo.find({
            where: [
                { schoolId, senderId: userId, recipientId: otherId },
                { schoolId, senderId: otherId, recipientId: userId },
            ],
            order: { createdAt: 'ASC' },
        });
    }
    async getInbox(schoolId, userId) {
        const all = await this.repo.find({
            where: [
                { schoolId, senderId: userId },
                { schoolId, recipientId: userId },
            ],
            order: { createdAt: 'DESC' },
        });
        const threads = new Map();
        for (const msg of all) {
            const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
            if (!threads.has(partnerId))
                threads.set(partnerId, msg);
        }
        return Array.from(threads.values());
    }
    async markRead(schoolId, userId, senderId) {
        await this.repo
            .createQueryBuilder()
            .update(message_entity_1.Message)
            .set({ isRead: true })
            .where('schoolId = :schoolId AND senderId = :senderId AND recipientId = :userId AND isRead = false', {
            schoolId,
            senderId,
            userId,
        })
            .execute();
    }
    countUnread(schoolId, userId) {
        return this.repo.count({ where: { schoolId, recipientId: userId, isRead: false } });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map