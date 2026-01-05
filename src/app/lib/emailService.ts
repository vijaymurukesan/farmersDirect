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

// Send user verification success email
export const sendUserVerificationEmail = async (
  to: string,
  fullName: string,
  userType: string
) => {
  const transporter = createTransporter();
  
  // Get the base URL from environment or construct it
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const loginLink = `${baseUrl}/login`;

  const mailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Account Verified - Access Granted! 🎉',
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
              background: linear-gradient(45deg, #388e3c, #2e7d32);
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 28px;
            }
            .header .icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .content {
              background: #fff;
              padding: 30px;
              border: 2px solid #c8e6c9;
              border-radius: 0 0 8px 8px;
            }
            .success-badge {
              background: #e8f5e9;
              border: 2px solid #388e3c;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
            }
            .success-badge h2 {
              color: #388e3c;
              margin: 0 0 10px 0;
              font-size: 22px;
            }
            .user-type {
              display: inline-block;
              background: #fffde7;
              color: #388e3c;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              text-transform: capitalize;
              border: 1px solid #c8e6c9;
            }
            .button {
              display: inline-block;
              padding: 14px 35px;
              background: linear-gradient(45deg, #388e3c, #2e7d32);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              box-shadow: 0 4px 12px rgba(56, 142, 60, 0.3);
            }
            .button:hover {
              background: linear-gradient(45deg, #2e7d32, #1b5e20);
            }
            .features {
              background: #f1f8e9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .features h3 {
              color: #388e3c;
              margin-top: 0;
            }
            .features ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .features li {
              margin: 8px 0;
              color: #6d4c41;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6d4c41;
              font-size: 12px;
            }
            .divider {
              border-top: 2px dashed #c8e6c9;
              margin: 25px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="icon">🎉</div>
            <h1>🌱 Farmers Direct</h1>
          </div>
          <div class="content">
            <div class="success-badge">
              <h2>✅ Account Verified Successfully!</h2>
              <p style="margin: 10px 0; color: #6d4c41;">
                Congratulations, <strong>${fullName}</strong>!
              </p>
            </div>
            
            <p>Great news! Your documents have been verified and your account has been approved.</p>
            
            <p style="margin: 20px 0;">
              Your <span class="user-type">${userType}</span> access has been granted!
            </p>
            
            <div class="features">
              <h3>🌟 What You Can Do Now:</h3>
              <ul>
                ${userType === 'farmer' ? `
                  <li>✅ Add and manage your agricultural products</li>
                  <li>✅ Connect directly with buyers</li>
                  <li>✅ Set your own prices and availability</li>
                  <li>✅ Track your orders and contracts</li>
                  <li>✅ Build your farmer profile</li>
                ` : userType === 'buyer' ? `
                  <li>✅ Browse products from verified farmers</li>
                  <li>✅ Purchase fresh agricultural products</li>
                  <li>✅ Connect directly with farmers</li>
                  <li>✅ Place bulk orders and contracts</li>
                  <li>✅ Track your purchases</li>
                ` : `
                  <li>✅ Access all platform features</li>
                  <li>✅ Connect with farmers and buyers</li>
                  <li>✅ Explore agricultural products</li>
                `}
              </ul>
            </div>

            <div class="divider"></div>
            
            <p style="text-align: center; margin: 25px 0;">
              Ready to get started? Click the button below to login to your account:
            </p>
            
            <div style="text-align: center;">
              <a href="${loginLink}" class="button">
                🚀 Login to Your Account
              </a>
            </div>
            
            <p style="text-align: center; font-size: 14px; color: #6d4c41; margin-top: 15px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #1976d2; font-size: 14px; text-align: center;">
              ${loginLink}
            </p>
            
            <div class="divider"></div>
            
            <p style="color: #6d4c41; font-size: 14px; margin-top: 25px;">
              <strong>Need Help?</strong><br>
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
            
            <p style="margin-top: 20px;">
              Thank you for choosing Farmers Direct - Connecting farmers and buyers directly! 🌱
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Farmers Direct. All rights reserved.</p>
            <p style="margin-top: 10px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      Farmers Direct - Account Verified Successfully!
      
      Congratulations, ${fullName}!
      
      Great news! Your documents have been verified and your account has been approved.
      
      Your ${userType.toUpperCase()} access has been granted!
      
      What You Can Do Now:
      ${userType === 'farmer' ? `
      - Add and manage your agricultural products
      - Connect directly with buyers
      - Set your own prices and availability
      - Track your orders and contracts
      - Build your farmer profile
      ` : userType === 'buyer' ? `
      - Browse products from verified farmers
      - Purchase fresh agricultural products
      - Connect directly with farmers
      - Place bulk orders and contracts
      - Track your purchases
      ` : `
      - Access all platform features
      - Connect with farmers and buyers
      - Explore agricultural products
      `}
      
      Ready to get started? Login to your account:
      ${loginLink}
      
      Thank you for choosing Farmers Direct!
      
      © 2026 Farmers Direct. All rights reserved.
      This is an automated message. Please do not reply to this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('User verification email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending user verification email:', error);
    throw error;
  }
};
