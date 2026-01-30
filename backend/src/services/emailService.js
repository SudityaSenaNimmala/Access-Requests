import createTransporter from '../config/email.js';

class EmailService {
  constructor() {
    this.transporter = null;
  }

  getTransporter() {
    if (!this.transporter) {
      this.transporter = createTransporter();
    }
    return this.transporter;
  }

  async sendEmail(to, subject, html) {
    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      });
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email send error:', error);
      // Don't throw - email failure shouldn't break the flow
      return null;
    }
  }

  async notifyTeamLeadNewRequest(teamLead, request, developer) {
    const subject = `New Query Request from ${developer.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Query Access Request</h2>
        <p>Hi ${teamLead.name},</p>
        <p><strong>${developer.name}</strong> has submitted a new query request that requires your approval.</p>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Database:</strong> ${request.dbInstanceName}</p>
          <p><strong>Collection:</strong> ${request.collectionName}</p>
          <p><strong>Query Type:</strong> ${request.queryType}</p>
          <p><strong>Reason:</strong> ${request.reason}</p>
          <p><strong>Query:</strong></p>
          <pre style="background: #1f2937; color: #f9fafb; padding: 12px; border-radius: 4px; overflow-x: auto;">${request.query}</pre>
        </div>
        
        <p>Please review and approve/reject this request in the DB Access Tool.</p>
        <a href="${process.env.FRONTEND_URL}/lead/requests" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Review Request
        </a>
      </div>
    `;
    
    return this.sendEmail(teamLead.email, subject, html);
  }

  async notifyDeveloperRequestApproved(developer, request) {
    const subject = `Query Request Approved - Results Available`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Query Request Approved</h2>
        <p>Hi ${developer.name},</p>
        <p>Your query request has been <strong style="color: #16a34a;">approved</strong> and executed.</p>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Database:</strong> ${request.dbInstanceName}</p>
          <p><strong>Collection:</strong> ${request.collectionName}</p>
          <p><strong>Query Type:</strong> ${request.queryType}</p>
          ${request.reviewComment ? `<p><strong>Comment:</strong> ${request.reviewComment}</p>` : ''}
        </div>
        
        <p>View the results in the DB Access Tool.</p>
        <a href="${process.env.FRONTEND_URL}/developer/requests/${request._id}" 
           style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          View Results
        </a>
      </div>
    `;
    
    return this.sendEmail(developer.email, subject, html);
  }

  async notifyDeveloperRequestRejected(developer, request) {
    const subject = `Query Request Rejected`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Query Request Rejected</h2>
        <p>Hi ${developer.name},</p>
        <p>Your query request has been <strong style="color: #dc2626;">rejected</strong>.</p>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Database:</strong> ${request.dbInstanceName}</p>
          <p><strong>Collection:</strong> ${request.collectionName}</p>
          <p><strong>Query Type:</strong> ${request.queryType}</p>
          ${request.reviewComment ? `<p><strong>Reason:</strong> ${request.reviewComment}</p>` : ''}
        </div>
        
        <p>Please review the feedback and submit a new request if needed.</p>
        <a href="${process.env.FRONTEND_URL}/developer/new-request" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Submit New Request
        </a>
      </div>
    `;
    
    return this.sendEmail(developer.email, subject, html);
  }

  async notifyDeveloperQueryFailed(developer, request, error) {
    const subject = `Query Execution Failed`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Query Execution Failed</h2>
        <p>Hi ${developer.name},</p>
        <p>Your approved query failed to execute.</p>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Database:</strong> ${request.dbInstanceName}</p>
          <p><strong>Collection:</strong> ${request.collectionName}</p>
          <p><strong>Error:</strong></p>
          <pre style="background: #fef2f2; color: #dc2626; padding: 12px; border-radius: 4px; overflow-x: auto;">${error}</pre>
        </div>
        
        <p>Please review your query and submit a new request.</p>
      </div>
    `;
    
    return this.sendEmail(developer.email, subject, html);
  }
}

export default new EmailService();
