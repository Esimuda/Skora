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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let MailService = MailService_1 = class MailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(MailService_1.name);
        this.transporter = nodemailer.createTransport({
            host: config.get('MAIL_HOST', 'smtp.gmail.com'),
            port: config.get('MAIL_PORT', 587),
            secure: false,
            auth: {
                user: config.get('MAIL_USER'),
                pass: config.get('MAIL_PASS'),
            },
        });
    }
    async sendTeacherInvite(opts) {
        const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:8px">
        <div style="background:#001944;padding:24px;border-radius:6px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:24px">Skora RMS</h1>
          <p style="color:#b3c5ff;margin:4px 0 0">Academic Ledger</p>
        </div>
        <h2 style="color:#001944">You've been invited!</h2>
        <p>Hello <strong>${opts.teacherName}</strong>,</p>
        <p><strong>${opts.principalName}</strong> has invited you to join <strong>${opts.schoolName}</strong> on Skora RMS as a teacher.</p>
        <div style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:16px;margin:24px 0">
          <p style="margin:0 0 8px"><strong>Your login details:</strong></p>
          <p style="margin:0">Email: <code>${opts.to}</code></p>
          <p style="margin:4px 0 0">Temporary password: <code style="background:#f3f4f5;padding:2px 6px;border-radius:3px">${opts.temporaryPassword}</code></p>
        </div>
        <a href="${opts.inviteUrl}" style="display:inline-block;background:#001944;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin-bottom:16px">
          Accept Invitation & Login
        </a>
        <p style="color:#757682;font-size:13px">Please change your password after your first login. This invite link is valid for 7 days.</p>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
        <p style="color:#757682;font-size:12px">Skora RMS — Nigerian School Result Management System</p>
      </div>
    `;
        try {
            await this.transporter.sendMail({
                from: `"Skora RMS" <${this.config.get('MAIL_FROM', this.config.get('MAIL_USER'))}>`,
                to: opts.to,
                subject: `You're invited to join ${opts.schoolName} on Skora RMS`,
                html,
            });
        }
        catch (err) {
            this.logger.error(`Failed to send invite email to ${opts.to}: ${err.message}`);
        }
    }
    async sendResultSubmittedAlert(opts) {
        const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:8px">
        <div style="background:#001944;padding:20px;border-radius:6px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:22px">Skora RMS</h1>
        </div>
        <h2 style="color:#001944">Results Ready for Review</h2>
        <p>Hello <strong>${opts.principalName}</strong>,</p>
        <p><strong>${opts.teacherName}</strong> has submitted results for <strong>${opts.className}</strong> (${opts.term} term, ${opts.academicYear}) and they are ready for your review.</p>
        ${opts.message ? `<blockquote style="border-left:3px solid #001944;padding:8px 16px;color:#444;font-style:italic">${opts.message}</blockquote>` : ''}
        <a href="${opts.appUrl}/approvals" style="display:inline-block;background:#001944;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">
          Review Results
        </a>
      </div>
    `;
        try {
            await this.transporter.sendMail({
                from: `"Skora RMS" <${this.config.get('MAIL_FROM', this.config.get('MAIL_USER'))}>`,
                to: opts.to,
                subject: `Results Ready — ${opts.className} | ${opts.term} term`,
                html,
            });
        }
        catch (err) {
            this.logger.error(`Failed to send result alert to ${opts.to}: ${err.message}`);
        }
    }
    async sendResultDecisionAlert(opts) {
        const approved = opts.decision === 'approved';
        const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:8px">
        <div style="background:${approved ? '#001944' : '#b00020'};padding:20px;border-radius:6px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:22px">Skora RMS</h1>
        </div>
        <h2 style="color:${approved ? '#001944' : '#b00020'}">${approved ? '✅ Results Approved' : '↩ Results Returned'}</h2>
        <p>Hello <strong>${opts.teacherName}</strong>,</p>
        <p>The results for <strong>${opts.className}</strong> (${opts.term} term) have been <strong>${approved ? 'approved' : 'returned for corrections'}</strong>.</p>
        ${opts.principalNote ? `<p><strong>Principal's note:</strong> <em>${opts.principalNote}</em></p>` : ''}
        ${!approved && opts.reason ? `<div style="background:#fff3f3;border:1px solid #ffcdd2;border-radius:6px;padding:12px 16px;margin:16px 0"><strong>Reason:</strong> ${opts.reason}</div>` : ''}
        <a href="${opts.appUrl}" style="display:inline-block;background:#001944;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">
          Open Skora RMS
        </a>
      </div>
    `;
        try {
            await this.transporter.sendMail({
                from: `"Skora RMS" <${this.config.get('MAIL_FROM', this.config.get('MAIL_USER'))}>`,
                to: opts.to,
                subject: `${approved ? '✅ Results Approved' : '↩ Results Returned'} — ${opts.className}`,
                html,
            });
        }
        catch (err) {
            this.logger.error(`Failed to send decision email to ${opts.to}: ${err.message}`);
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map