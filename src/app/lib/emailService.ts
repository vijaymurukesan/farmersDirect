import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to other services like Outlook, Yahoo, etc.
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASSWORD, // Your app password (NOT your regular Gmail password)
    },
  });
};

// Send verification email
export const sendVerificationEmail = async (
  to: string,
  verificationLink: string
) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Verify Your Email - Farmers Direct',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #e8f5e9;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              color: #388e3c;
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #fff;
              padding: 30px;
              border: 2px solid #c8e6c9;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #388e3c;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .button:hover {
              background: #2e7d32;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6d4c41;
              font-size: 12px;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 10px;
              border-radius: 4px;
              margin-top: 20px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌱 Farmers Direct</h1>
          </div>
          <div class="content">
            <h2 style="color: #388e3c;">Verify Your Email Address</h2>
            <p>Thank you for registering with Farmers Direct!</p>
            <p>To complete your registration and start using our platform, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">
                ✅ Verify Email Address
              </a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1976d2; font-size: 14px;">
              ${verificationLink}
            </p>
            
            <div class="warning">
              ⚠️ <strong>Important:</strong> This verification link will expire in 24 hours.
            </div>
            
            <p style="margin-top: 20px;">
              If you didn't create an account with Farmers Direct, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Farmers Direct. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Farmers Direct - Email Verification
      
      Thank you for registering with Farmers Direct!
      
      To complete your registration, please verify your email address by clicking the link below:
      
      ${verificationLink}
      
      This verification link will expire in 24 hours.
      
      If you didn't create an account with Farmers Direct, please ignore this email.
      
      © 2025 Farmers Direct. All rights reserved.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
