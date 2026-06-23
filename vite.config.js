import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom SMTP backend middleware for local development
const smtpMiddleware = () => ({
  name: 'smtp-middleware',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/send-email' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { smtpConfig, emailData } = JSON.parse(body);
            
            // Dynamically import nodemailer to avoid startup build issues
            const nodemailer = await import('nodemailer').then(m => m.default || m);
            
            const transporter = nodemailer.createTransport({
              host: smtpConfig.host,
              port: parseInt(smtpConfig.port),
              secure: smtpConfig.port === '465', // SSL on 465, TLS/STARTTLS on others
              auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
              },
            });
            
            const mailOptions = {
              from: `"${smtpConfig.senderName || smtpConfig.user}" <${smtpConfig.user}>`,
              to: emailData.to,
              subject: emailData.subject,
              text: emailData.body.replace(/<[^>]+>/g, ''), // Strip HTML tags for plain text fallback
              html: emailData.body.replace(/\n/g, '<br />'), // Convert newlines to breaks for HTML email client rendering
              replyTo: smtpConfig.replyTo || smtpConfig.user
            };
            
            if (emailData.attachments && emailData.attachments.length > 0) {
              mailOptions.attachments = emailData.attachments.map(att => ({
                filename: att.filename || att.name,
                content: Buffer.from(att.content, 'base64'),
                contentType: att.contentType || 'application/pdf'
              }));
            }
            
            await transporter.sendMail(mailOptions);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            console.error('SMTP sending error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
          }
        });
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), smtpMiddleware()],
})
