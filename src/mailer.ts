import { createTransport } from 'nodemailer';
import 'dotenv/config';

export async function sendAlert(url: string, errorDetails: string, proxyUsed: string | null = null, title: string = '') {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log("Skipping email alert - SMTP not configured.");
    return;
  }

  try {
    const transporter = createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587'),
      secure: parseInt(SMTP_PORT || '587') === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"Uptime Sentinel" <${SMTP_USER}>`,
      to: process.env.ALERT_EMAIL || SMTP_USER, // fallback
      subject: `🚨 DOWN: ${url} - ${errorDetails.substring(0, 50)}`,
      html: `
        <h2>Monitor Alert: URL is DOWN</h2>
        <p><strong>URL:</strong> <a href="${url}">${url}</a></p>
        <p><strong>Page Title:</strong> ${title || 'N/A'}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Network Route:</strong> ${proxyUsed || 'Direct'}</p>
        <h3>Error Details:</h3>
        <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${errorDetails}</pre>
      `
    });
    console.log('Alert email sent:', info.messageId);
  } catch (err) {
    console.error('Failed to send alert email:', err);
  }
}
