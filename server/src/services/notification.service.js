import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

class NotificationService {
  constructor() {
    this.transporter = null;
    this.prisma = null;
    this.sseClients = new Set();
    this.initTransporter();
  }

  setPrisma(prismaClient) {
    this.prisma = prismaClient;
  }

  // Register push notification client for Server-Sent Events (SSE)
  registerPushClient(clientRes) {
    this.sseClients.add(clientRes);
    return () => this.sseClients.delete(clientRes);
  }

  // Broadcast push notification to connected vigilance staff or tracking citizens
  broadcastPushEvent(eventType, data) {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  async initTransporter() {
    try {
      if (config.smtp.user && config.smtp.pass) {
        this.transporter = nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.secure,
          auth: {
            user: config.smtp.user,
            pass: config.smtp.pass
          }
        });
      } else {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log(`[NotificationService] Dev Ethereal SMTP initialized: ${testAccount.user}`);
      }
    } catch (err) {
      console.warn('[NotificationService] Transporter init deferred:', err.message);
    }
  }

  /**
   * Dispatch SMS notification (Twilio / Telecom Gateway Adapter)
   */
  async sendSms({ complaintId, phoneNumber, message }) {
    if (!phoneNumber) return { success: false, reason: 'No phone number' };

    // Standardized SMS payload
    console.log(`📱 [SMS Gateway] Transmitting to ${phoneNumber}: "${message}"`);

    if (this.prisma) {
      await this.prisma.notificationLog.create({
        data: {
          complaintId,
          channel: 'SMS',
          recipient: phoneNumber,
          subject: 'SMS Status Alert',
          message,
          status: 'SUCCESS'
        }
      }).catch(() => {});
    }

    return {
      success: true,
      channel: 'SMS',
      gateway: 'MockTelecomGateway',
      recipient: phoneNumber,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send notification for newly submitted complaint
   */
  async notifySubmission({ complaintId, trackingId, recipientEmail, recipientPhone, department, category }) {
    // 1. Broadcast Real-Time Push Event to connected Admin Dashboards
    this.broadcastPushEvent('NEW_COMPLAINT_SUBMITTED', {
      trackingId,
      department,
      category,
      timestamp: new Date().toISOString()
    });

    // 2. Dispatch SMS if phone provided
    if (recipientPhone) {
      this.sendSms({
        complaintId,
        phoneNumber: recipientPhone,
        message: `BribeShield: Your complaint tracking ID is ${trackingId}. It is encrypted and under review.`
      }).catch(err => console.warn('SMS dispatch error:', err.message));
    }

    // 3. Dispatch Email if email provided
    if (recipientEmail && recipientEmail.includes('@')) {
      const subject = `[BribeShield AI] Complaint Submitted - Tracking ID: ${trackingId}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">BribeShield AI - Confirmation</h2>
          <p>Your complaint has been encrypted and securely registered in the immutable anti-corruption repository.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">Your Confidential Tracking ID:</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 1px;">${trackingId}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Department:</td>
              <td style="padding: 6px 0; font-weight: 500;">${department}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Category:</td>
              <td style="padding: 6px 0; font-weight: 500;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Status:</td>
              <td style="padding: 6px 0; font-weight: 500; color: #0284c7;">SUBMITTED</td>
            </tr>
          </table>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            <strong>Security Notice:</strong> Your identity and sensitive evidence are protected with AES-256 encryption. Keep this Tracking ID safe; you can use it at any time to check status updates without logging in.
          </p>
        </div>
      `;

      return this.sendMail({
        complaintId,
        to: recipientEmail,
        subject,
        html,
        text: `Your BribeShield AI complaint tracking ID is: ${trackingId}`
      });
    }

    return { success: true };
  }

  /**
   * Send status transition update notification
   */
  async notifyStatusChange({ complaintId, trackingId, recipientEmail, recipientPhone, oldStatus, newStatus, remarks }) {
    // 1. Broadcast Push Notification
    this.broadcastPushEvent('COMPLAINT_STATUS_UPDATED', {
      trackingId,
      oldStatus,
      newStatus,
      remarks,
      timestamp: new Date().toISOString()
    });

    // 2. Dispatch SMS
    if (recipientPhone) {
      this.sendSms({
        complaintId,
        phoneNumber: recipientPhone,
        message: `BribeShield: Case ${trackingId} updated to ${newStatus}. Remarks: ${remarks || 'Review in progress.'}`
      }).catch(err => console.warn('SMS notify error:', err.message));
    }

    // 3. Dispatch Email
    if (recipientEmail && recipientEmail.includes('@')) {
      const subject = `[BribeShield AI Update] Status Changed to ${newStatus} - ${trackingId}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Complaint Status Update</h2>
          <p>The status of your registered grievance has progressed:</p>

          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 0; font-size: 13px; color: #64748b;">Tracking ID: <strong>${trackingId}</strong></p>
            <div style="margin-top: 8px; font-size: 16px;">
              <span style="color: #64748b;">${oldStatus}</span> &rarr; <strong style="color: #16a34a;">${newStatus}</strong>
            </div>
          </div>

          ${remarks ? `<div style="background-color: #fff; border-left: 4px solid #3b82f6; padding: 10px 15px; margin: 15px 0;">
            <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Officer Remarks:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #475569;">${remarks}</p>
          </div>` : ''}

          <p style="font-size: 12px; color: #94a3b8; margin-top: 25px;">
            BribeShield AI • Citizen Vigilance & Integrity Platform
          </p>
        </div>
      `;

      return this.sendMail({
        complaintId,
        to: recipientEmail,
        subject,
        html,
        text: `Status for complaint ${trackingId} updated to ${newStatus}. Remarks: ${remarks || 'None'}`
      });
    }

    return null;
  }

  async sendMail({ complaintId, to, subject, html, text }) {
    try {
      if (!this.transporter) await this.initTransporter();

      const info = await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
        text
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[NotificationService] Email Preview URL: ${previewUrl}`);
      }

      if (this.prisma) {
        await this.prisma.notificationLog.create({
          data: {
            complaintId,
            channel: 'EMAIL',
            recipient: to,
            subject,
            message: text || subject,
            status: 'SUCCESS'
          }
        }).catch(() => {});
      }

      return { success: true, messageId: info.messageId, previewUrl };
    } catch (error) {
      console.error('[NotificationService] Email dispatch failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export const notificationService = new NotificationService();
