/**
 * Email Notification Helper for Image Processing Errors
 *
 * Uses existing Resend integration to send error notifications to admin
 */

/**
 * Send error notification email when image processing fails
 *
 * @param {Object} env - Worker environment with RESEND_API_KEY and FROM_EMAIL
 * @param {string} farmId - Farm Zoho record ID
 * @param {string} farmName - Farm name for context
 * @param {string} imageType - 'logo' or 'background'
 * @param {Error} error - Error object with details
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendImageErrorEmail(env, farmId, farmName, imageType, error) {
  console.log(`📧 Sending error notification for ${farmName} ${imageType}...`);

  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const emailBody = `
Image Processing Error Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Farm Details:
  • Name: ${farmName}
  • ID: ${farmId}
  • Image Type: ${imageType}

Error Details:
  • Message: ${error.message}
  • Stack: ${error.stack || 'Not available'}

Timestamp: ${new Date().toISOString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Action Required:
Please check the farm record in Zoho CRM and verify the image URL is valid and accessible.

Troubleshooting Steps:
1. Verify the image URL in Zoho CRM is accessible
2. Check that the image is a valid format (JPEG, PNG, WebP)
3. Ensure the image is under 10MB
4. Check Worker logs for additional details
5. Test the URL manually in a browser

If the issue persists, contact the development team.
`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'PickAFarm Notifications <updates@notifications.pickafarm.com>',
        to: ['hello@pickafarm.com'],
        subject: `[PickAFarm] Image Processing Error - ${farmName}`,
        text: emailBody
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return { success: false, error: `Resend API error: ${response.status}` };
    }

    const result = await response.json();
    console.log(`✅ Error notification sent: ${result.id}`);

    return { success: true, messageId: result.id };
  } catch (err) {
    console.error('Failed to send error notification:', err);
    return { success: false, error: err.message };
  }
}
