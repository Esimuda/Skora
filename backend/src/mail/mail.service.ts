import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

@Injectable()
export class MailService {
  private apiKey: string | undefined;
  private from: string;
  private readonly enabled: boolean;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    this.apiKey = config.get<string>('RESEND_API_KEY');
    this.from = config.get<string>('MAIL_FROM', '').trim();
    this.enabled = !!this.apiKey && !!this.from;

    if (!this.apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not set — emails will NOT be sent. Create one at https://resend.com/api-keys',
      );
    } else if (!this.from) {
      this.logger.warn(
        'MAIL_FROM is not set — emails will NOT be sent. Use an address on a domain you verified at https://resend.com/domains (e.g. "Skora RMS <noreply@yourdomain.xyz>").',
      );
    } else {
      this.logger.log(`Resend mail transport ready (sender=${this.from})`);
    }
  }

  private async send(opts: { to: string; subject: string; html: string; context: string }) {
    if (!this.enabled) {
      this.logger.warn(`[${opts.context}] Skipped email to ${opts.to} — Resend not configured`);
      return;
    }
    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [opts.to],
          subject: opts.subject,
          html: opts.html,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const detail = body.message ?? body.name ?? response.statusText;
        this.logger.error(
          `[${opts.context}] Resend rejected email to ${opts.to}: ${response.status} ${detail}`,
        );
        return;
      }

      const body = await response.json().catch(() => ({} as { id?: string }));
      this.logger.log(`[${opts.context}] Sent to ${opts.to} (resend id=${body.id ?? 'n/a'})`);
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
  async sendClassAssignmentNotification(opts: {
    to: string;
    teacherName: string;
    className: string;
    academicYear: string;
    appUrl: string;
  }) {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:8px">
        <div style="background:#001944;padding:24px;border-radius:6px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:24px">Skora RMS</h1>
          <p style="color:#b3c5ff;margin:4px 0 0">Academic Ledger</p>
        </div>
        <h2 style="color:#001944">Class Assignment</h2>
        <p>Hello <strong>${opts.teacherName}</strong>,</p>
        <p>You have been assigned as the class teacher for <strong>${opts.className}</strong> for the <strong>${opts.academicYear}</strong> academic year.</p>
        <p>You can now log in to Skora RMS to view your class, enter scores, record attendance, and manage student results.</p>
        <a href="${opts.appUrl}" style="display:inline-block;background:#001944;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">
          Open Skora RMS
        </a>
        <p style="color:#757682;font-size:13px">If you have any questions, please contact your principal.</p>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
        <p style="color:#757682;font-size:12px">Skora RMS — Nigerian School Result Management System</p>
      </div>
    `;

    await this.send({
      to: opts.to,
      subject: `You've been assigned to ${opts.className} on Skora RMS`,
      html,
      context: 'class-assignment',
    });
  }
  async sendPasswordReset(opts: {
    to: string;
    firstName: string;
    resetUrl: string;
  }) {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:8px">
        <div style="background:#001944;padding:24px;border-radius:6px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:24px">Skora RMS</h1>
          <p style="color:#b3c5ff;margin:4px 0 0">Academic Ledger</p>
        </div>
        <h2 style="color:#001944">Reset Your Password</h2>
        <p>Hello <strong>${opts.firstName}</strong>,</p>
        <p>We received a request to reset your Skora RMS password. Click the button below to choose a new password.</p>
        <a href="${opts.resetUrl}"
           style="display:inline-block;background:#001944;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">
          Reset My Password
        </a>
        <p style="color:#757682;font-size:13px">This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.</p>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
        <p style="color:#757682;font-size:12px">Skora RMS — Nigerian School Result Management System</p>
      </div>
    `;

    await this.send({
      to: opts.to,
      subject: 'Reset your Skora RMS password',
      html,
      context: 'password-reset',
    });
  }
  async sendBatchRequestNotification(opts: {
    schoolName: string;
    principalName: string;
    principalEmail: string;
    quantity: number;
    totalAmount: number;
    term: string;
    academicYear: string;
  }) {
    const superAdminEmail = this.config.get<string>('SUPER_ADMIN_EMAIL', '');
    if (!superAdminEmail) return;

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:8px">
        <div style="background:#001944;padding:24px;border-radius:6px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:24px">Skora RMS</h1>
          <p style="color:#b3c5ff;margin:4px 0 0">Admin Alert</p>
        </div>
        <h2 style="color:#001944">New Batch Request</h2>
        <p><strong>${opts.schoolName}</strong> has requested a scratch card batch.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
          <tr style="background:#f3f4f5">
            <td style="padding:8px 12px;font-weight:700">School</td>
            <td style="padding:8px 12px">${opts.schoolName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:700">Principal</td>
            <td style="padding:8px 12px">${opts.principalName} (${opts.principalEmail})</td>
          </tr>
          <tr style="background:#f3f4f5">
            <td style="padding:8px 12px;font-weight:700">Cards Requested</td>
            <td style="padding:8px 12px">${opts.quantity}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:700">Amount Due</td>
            <td style="padding:8px 12px;font-weight:900;color:#001944">₦${opts.totalAmount.toLocaleString()}</td>
          </tr>
          <tr style="background:#f3f4f5">
            <td style="padding:8px 12px;font-weight:700">Term</td>
            <td style="padding:8px 12px">${opts.term} Term · ${opts.academicYear}</td>
          </tr>
        </table>
        <p style="color:#757682;font-size:13px">Log in to the Skora admin panel to confirm payment and activate this batch.</p>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
        <p style="color:#757682;font-size:12px">Skora RMS — Platform Admin Notification</p>
      </div>
    `;

    await this.send({
      to: superAdminEmail,
      subject: `New batch request — ${opts.schoolName} (₦${opts.totalAmount.toLocaleString()})`,
      html,
      context: 'batch-request',
    });
  }

  async sendBatchActivatedNotification(opts: {
    to: string;
    principalName: string;
    schoolName: string;
    quantity: number;
    term: string;
    academicYear: string;
  }) {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:8px">
        <div style="background:#001944;padding:24px;border-radius:6px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:24px">Skora RMS</h1>
          <p style="color:#b3c5ff;margin:4px 0 0">Academic Ledger</p>
        </div>
        <h2 style="color:#001944">Your Scratch Cards Are Ready</h2>
        <p>Hello <strong>${opts.principalName}</strong>,</p>
        <p>Your payment has been confirmed and your scratch card batch for <strong>${opts.schoolName}</strong> has been activated.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
          <tr style="background:#f3f4f5">
            <td style="padding:8px 12px;font-weight:700">Cards Ready</td>
            <td style="padding:8px 12px;font-weight:900;color:#001944">${opts.quantity} PINs</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:700">Term</td>
            <td style="padding:8px 12px">${opts.term} Term · ${opts.academicYear}</td>
          </tr>
        </table>
        <p>Log in to Skora RMS, go to <strong>Settings → Result Access Cards</strong>, and click <strong>Download Cards PDF</strong> to print your scratch cards.</p>
        <p style="color:#757682;font-size:13px">Each card is valid for 5 uses. Sell them to parents at your preferred price.</p>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
        <p style="color:#757682;font-size:12px">Skora RMS — Nigerian School Result Management System</p>
      </div>
    `;

    await this.send({
      to: opts.to,
      subject: `Your ${opts.quantity} scratch cards are ready — ${opts.schoolName}`,
      html,
      context: 'batch-activated',
    });
  }
}
