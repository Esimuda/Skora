import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

function parseFrom(raw: string): { name: string; email: string } {
  // Accepts "Name <email@host>" or a bare email address.
  const match = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    const name = match[1].replace(/^["']|["']$/g, '').trim() || 'Skora RMS';
    return { name, email: match[2].trim() };
  }
  return { name: 'Skora RMS', email: raw.trim() };
}

@Injectable()
export class MailService {
  private apiKey: string | undefined;
  private from: { name: string; email: string };
  private readonly enabled: boolean;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    this.apiKey = config.get<string>('BREVO_API_KEY');
    const rawFrom = config.get<string>('MAIL_FROM', '');
    this.from = parseFrom(rawFrom);
    this.enabled = !!this.apiKey && !!this.from.email;

    if (!this.apiKey) {
      this.logger.warn(
        'BREVO_API_KEY is not set — emails will NOT be sent. Create one at https://app.brevo.com/settings/keys/api',
      );
    } else if (!this.from.email) {
      this.logger.warn(
        'MAIL_FROM is not set — emails will NOT be sent. Use the email you verified as a sender on Brevo (e.g. "Skora RMS <skora.systems@gmail.com>").',
      );
    } else {
      this.logger.log(`Brevo mail transport ready (sender=${this.from.name} <${this.from.email}>)`);
    }
  }

  private async send(opts: { to: string; subject: string; html: string; context: string }) {
    if (!this.enabled) {
      this.logger.warn(`[${opts.context}] Skipped email to ${opts.to} — Brevo not configured`);
      return;
    }
    try {
      const response = await fetch(BREVO_ENDPOINT, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey!,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: this.from,
          to: [{ email: opts.to }],
          subject: opts.subject,
          htmlContent: opts.html,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const detail = body.message ?? body.code ?? response.statusText;
        this.logger.error(
          `[${opts.context}] Brevo rejected email to ${opts.to}: ${response.status} ${detail}`,
        );
        return;
      }

      const body = await response.json().catch(() => ({} as { messageId?: string }));
      this.logger.log(`[${opts.context}] Sent to ${opts.to} (brevo messageId=${body.messageId ?? 'n/a'})`);
    } catch (err: any) {
      this.logger.error(
        `[${opts.context}] Failed to send email to ${opts.to}: ${err?.message ?? err}`,
        err?.stack,
      );
    }
  }

  async sendTeacherInvite(opts: {
    to: string;
    teacherName: string;
    schoolName: string;
    principalName: string;
    inviteUrl: string;
    temporaryPassword: string;
  }) {
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

    await this.send({
      to: opts.to,
      subject: `You're invited to join ${opts.schoolName} on Skora RMS`,
      html,
      context: 'teacher-invite',
    });
  }

  async sendResultSubmittedAlert(opts: {
    to: string;
    principalName: string;
    teacherName: string;
    className: string;
    term: string;
    academicYear: string;
    appUrl: string;
    message?: string;
  }) {
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

    await this.send({
      to: opts.to,
      subject: `Results Ready — ${opts.className} | ${opts.term} term`,
      html,
      context: 'result-submitted',
    });
  }

  async sendResultDecisionAlert(opts: {
    to: string;
    teacherName: string;
    className: string;
    term: string;
    decision: 'approved' | 'rejected';
    reason?: string;
    principalNote?: string;
    appUrl: string;
  }) {
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

    await this.send({
      to: opts.to,
      subject: `${approved ? '✅ Results Approved' : '↩ Results Returned'} — ${opts.className}`,
      html,
      context: `result-${opts.decision}`,
    });
  }
}
