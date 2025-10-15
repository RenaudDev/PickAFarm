/**
 * Email Template Generation for Magic Link Invitations
 *
 * Generates HTML email templates for farmer invitation magic links
 * Compatible with Resend API
 *
 * Brand Colors:
 * - Primary Green: #2D5016
 * - Light Gray: #666
 * - Border Gray: #eee
 */

/**
 * Generates a magic link invitation email HTML template
 *
 * @param {string} farmName - Name of the farm being claimed
 * @param {string} magicLink - Full magic link URL
 * @param {string} expiresIn - Human-readable expiration time (e.g., "24 hours")
 * @param {Object} options - Optional customization
 * @param {string} options.farmLocation - Farm location for context (optional)
 * @returns {Object} Email template object {from, subject, html, text}
 */
export function generateMagicLinkEmail(farmName, magicLink, expiresIn = '24 hours', options = {}) {
  const { farmLocation } = options;

  const subject = `Claim Your ${farmName} Listing on PickAFarm`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
">
  <!-- Header -->
  <div style="
    background-color: #2D5016;
    color: white;
    padding: 30px 20px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  ">
    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">
      🌲 PickAFarm
    </h1>
    <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
      Connecting Farms with Customers
    </p>
  </div>

  <!-- Main Content -->
  <div style="
    background-color: white;
    padding: 40px 30px;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  ">
    <h2 style="
      color: #2D5016;
      font-size: 24px;
      margin: 0 0 20px;
      font-weight: bold;
    ">
      Claim Your Farm Listing
    </h2>

    <p style="margin: 0 0 15px; font-size: 16px;">
      Hi there,
    </p>

    <p style="margin: 0 0 15px; font-size: 16px;">
      You've been invited to claim your farm listing on <strong>PickAFarm</strong> and access your farmer dashboard.
    </p>

    <!-- Farm Info Box -->
    <div style="
      background-color: #f9f9f9;
      border-left: 4px solid #2D5016;
      padding: 15px 20px;
      margin: 25px 0;
      border-radius: 4px;
    ">
      <p style="margin: 0 0 8px; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
        <strong>Your Farm</strong>
      </p>
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2D5016;">
        ${farmName}
      </p>
      ${farmLocation ? `
      <p style="margin: 5px 0 0; font-size: 14px; color: #666;">
        📍 ${farmLocation}
      </p>
      ` : ''}
    </div>

    <p style="margin: 20px 0; font-size: 16px;">
      Click the button below to claim your listing and set up your farmer account:
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 35px 0;">
      <a href="${magicLink}"
         style="
           display: inline-block;
           background-color: #2D5016;
           color: white;
           padding: 16px 40px;
           text-decoration: none;
           border-radius: 6px;
           font-weight: bold;
           font-size: 16px;
           box-shadow: 0 4px 6px rgba(45, 80, 22, 0.2);
           transition: background-color 0.2s;
         ">
        Claim My Farm Listing
      </a>
    </div>

    <!-- Alternative Link -->
    <p style="
      margin: 25px 0;
      padding: 15px;
      background-color: #f0f0f0;
      border-radius: 4px;
      font-size: 13px;
      color: #666;
    ">
      <strong>Button not working?</strong> Copy and paste this link into your browser:<br>
      <a href="${magicLink}" style="color: #2D5016; word-break: break-all;">
        ${magicLink}
      </a>
    </p>

    <!-- Expiration Warning -->
    <div style="
      border-top: 1px solid #eee;
      padding-top: 20px;
      margin-top: 30px;
    ">
      <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
        ⏱️ <strong>Important:</strong> This link will expire in <strong>${expiresIn}</strong>.
      </p>
      <p style="margin: 0; font-size: 14px; color: #666;">
        If you didn't request this invitation or have any questions, please contact us at
        <a href="mailto:support@pickafarm.com" style="color: #2D5016; text-decoration: none;">
          support@pickafarm.com
        </a>
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="
    text-align: center;
    padding: 30px 20px 20px;
    color: #999;
    font-size: 12px;
  ">
    <p style="margin: 0 0 10px;">
      <strong>PickAFarm</strong> - Connecting Farms with Customers
    </p>
    <p style="margin: 0 0 10px;">
      Questions? Contact us at
      <a href="mailto:support@pickafarm.com" style="color: #2D5016; text-decoration: none;">
        support@pickafarm.com
      </a>
    </p>
    <p style="margin: 0; color: #ccc;">
      © ${new Date().getFullYear()} PickAFarm. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim();

  // Plain text version (for email clients that don't support HTML)
  const text = `
Claim Your Farm Listing on PickAFarm

Hi there,

You've been invited to claim your farm listing on PickAFarm and access your farmer dashboard.

Your Farm: ${farmName}
${farmLocation ? `Location: ${farmLocation}` : ''}

Click the link below to claim your listing:
${magicLink}

This link will expire in ${expiresIn}.

If you didn't request this invitation, you can safely ignore this email or contact us at support@pickafarm.com.

---
PickAFarm - Connecting Farms with Customers
Questions? support@pickafarm.com
  `.trim();

  return {
    subject,
    html,
    text
  };
}

/**
 * Sends a magic link email via Resend API
 *
 * @param {Object} env - Worker environment bindings
 * @param {string} toEmail - Recipient email address
 * @param {string} farmName - Name of the farm
 * @param {string} magicLink - Magic link URL
 * @param {Object} options - Optional parameters
 * @param {string} options.farmLocation - Farm location
 * @param {string} options.fromEmail - From email address (default: env.FROM_EMAIL)
 * @returns {Promise<string>} Resend email ID
 * @throws {Error} If email send fails
 */
export async function sendMagicLinkEmail(env, toEmail, farmName, magicLink, options = {}) {
  const { farmLocation, fromEmail } = options;

  // Generate email template
  const emailData = generateMagicLinkEmail(farmName, magicLink, '24 hours', { farmLocation });

  // Prepare Resend API request
  const resendPayload = {
    from: fromEmail || env.FROM_EMAIL || 'PickAFarm <farmer-invites@notifications.pickafarm.com>',
    to: [toEmail],
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text,
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resendPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Log email send to notification_log table
    try {
      await env.DB.prepare(`
        INSERT INTO notification_log (
          farm_id, user_id, notification_type, email_sent, email_id, sent_at
        ) VALUES (?, ?, 'magic_link_invite', 1, ?, CURRENT_TIMESTAMP)
      `).bind(null, toEmail, result.id).run();
    } catch (dbError) {
      console.error('Failed to log email send:', dbError);
      // Don't throw - email was sent successfully
    }

    console.log(`Magic link email sent: ${result.id} to ${toEmail}`);
    return result.id; // Resend email ID for tracking
  } catch (error) {
    console.error('Failed to send magic link email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}

/**
 * Validates email address format
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
