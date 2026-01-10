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
  
  // Add forceLogout parameter to verification link
  const separator = verificationLink.includes('?') ? '&' : '?';
  const linkWithLogout = `${verificationLink}${separator}forceLogout=true`;

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
              <a href="${linkWithLogout}" class="button">
                ✅ Verify Email Address
              </a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1976d2; font-size: 14px;">
              ${linkWithLogout}
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
      
      ${linkWithLogout}
      
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
  const loginLink = `${baseUrl}/login?forceLogout=true`;

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

// Send document rejection email
export const sendDocumentRejectionEmail = async (
  to: string,
  fullName: string,
  documentType: string,
  rejectionReason: string,
  verificationLink: string
) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Document Resubmission Required - Farmers Direct',
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
              background: #fff3cd;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
              border-top: 4px solid #ff9800;
            }
            .header h1 {
              color: #ff6f00;
              margin: 0;
              font-size: 24px;
            }
            .header .icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .content {
              background: #fff;
              padding: 30px;
              border: 2px solid #ffe082;
              border-radius: 0 0 8px 8px;
            }
            .alert-box {
              background: #ffebee;
              border-left: 4px solid #f44336;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
            }
            .alert-box h3 {
              color: #d32f2f;
              margin: 0 0 10px 0;
              font-size: 18px;
            }
            .document-info {
              background: #f1f8e9;
              border: 2px solid #c8e6c9;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .document-info h3 {
              color: #388e3c;
              margin: 0 0 10px 0;
            }
            .document-info p {
              margin: 5px 0;
              color: #6d4c41;
            }
            .reason-box {
              background: #fff9e6;
              border: 1px solid #ffd54f;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
            }
            .reason-box strong {
              color: #f57c00;
            }
            .button {
              display: inline-block;
              padding: 14px 35px;
              background: #388e3c;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              box-shadow: 0 4px 12px rgba(56, 142, 60, 0.3);
            }
            .button:hover {
              background: #2e7d32;
            }
            .steps {
              background: #e8f5e9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .steps h3 {
              color: #388e3c;
              margin-top: 0;
            }
            .steps ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .steps li {
              margin: 10px 0;
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
            .warning-note {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 12px;
              border-radius: 4px;
              margin-top: 20px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="icon">⚠️</div>
            <h1>Document Resubmission Required</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${fullName}</strong>,</p>
            
            <p>Thank you for submitting your verification documents to Farmers Direct.</p>
            
            <div class="alert-box">
              <h3>📄 Document Review Update</h3>
              <p>We've reviewed your submitted documents and unfortunately, we need you to resubmit the following document:</p>
            </div>

            <div class="document-info">
              <h3>Rejected Document:</h3>
              <p style="font-size: 18px; font-weight: bold; color: #d32f2f;">
                ${documentType}
              </p>
            </div>

            <div class="reason-box">
              <strong>⚠️ Rejection Reason:</strong>
              <p style="margin: 10px 0 0 0; font-size: 15px; color: #333;">
                ${rejectionReason}
              </p>
            </div>

            <div class="divider"></div>

            <div class="steps">
              <h3>📋 How to Resubmit Your Document:</h3>
              <ol>
                <li><strong>Click the button below</strong> to go to the verification page</li>
                <li><strong>Locate the rejected document</strong> (marked with rejection reason)</li>
                <li><strong>Click "Reupload Document"</strong> button for that specific document</li>
                <li><strong>Select a new file</strong> that addresses the rejection reason</li>
                <li><strong>Submit</strong> the document for review</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button">
                📤 Go to Verification Page
              </a>
            </div>

            <p style="text-align: center; font-size: 14px; color: #6d4c41;">
              Or copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #1976d2; font-size: 14px; text-align: center;">
              ${verificationLink}
            </p>

            <div class="warning-note">
              <strong>⏰ Important:</strong> Please resubmit your document as soon as possible to complete your account verification and gain full access to the platform.
            </div>

            <div class="divider"></div>

            <p style="color: #6d4c41; font-size: 14px; margin-top: 25px;">
              <strong>Need Help?</strong><br>
              If you have any questions about the rejection reason or need assistance with the resubmission process, please contact our support team.
            </p>

            <p style="margin-top: 25px;">
              Thank you for your cooperation and patience! 🌱
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
      Farmers Direct - Document Resubmission Required
      
      Dear ${fullName},
      
      Thank you for submitting your verification documents to Farmers Direct.
      
      DOCUMENT REVIEW UPDATE:
      We've reviewed your submitted documents and unfortunately, we need you to resubmit the following document:
      
      Rejected Document: ${documentType}
      
      Rejection Reason: ${rejectionReason}
      
      HOW TO RESUBMIT YOUR DOCUMENT:
      1. Visit the verification page: ${verificationLink}
      2. Locate the rejected document (marked with rejection reason)
      3. Click "Reupload Document" button for that specific document
      4. Select a new file that addresses the rejection reason
      5. Submit the document for review
      
      IMPORTANT: Please resubmit your document as soon as possible to complete your account verification and gain full access to the platform.
      
      Need Help?
      If you have any questions about the rejection reason or need assistance with the resubmission process, please contact our support team.
      
      Thank you for your cooperation and patience!
      
      © 2026 Farmers Direct. All rights reserved.
      This is an automated message. Please do not reply to this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Document rejection email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending document rejection email:', error);
    throw error;
  }
};

// Send product rejection email
export const sendProductRejectionEmail = async (
  to: string,
  productTitle: string,
  rejectionReason: string,
  userType: string
) => {
  const transporter = createTransporter();
  const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/`;

  const mailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Product Submission Rejected - Farmers Direct',
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
              background: #ffebee;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
              border-top: 4px solid #f44336;
            }
            .header h1 {
              color: #d32f2f;
              margin: 0;
              font-size: 24px;
            }
            .header .icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .content {
              background: #fff;
              padding: 30px;
              border: 2px solid #ffcdd2;
              border-radius: 0 0 8px 8px;
            }
            .alert-box {
              background: #fff3e0;
              border-left: 4px solid #ff9800;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
            }
            .alert-box h3 {
              color: #f57c00;
              margin: 0 0 10px 0;
              font-size: 18px;
            }
            .product-info {
              background: #f1f8e9;
              border: 2px solid #c8e6c9;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .product-info h3 {
              color: #388e3c;
              margin: 0 0 10px 0;
            }
            .product-info p {
              margin: 5px 0;
              color: #6d4c41;
              font-size: 16px;
              font-weight: bold;
            }
            .reason-box {
              background: #ffebee;
              border: 2px solid #ef9a9a;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
            }
            .reason-box strong {
              color: #d32f2f;
              display: block;
              margin-bottom: 8px;
              font-size: 16px;
            }
            .reason-box p {
              margin: 0;
              color: #333;
              font-size: 15px;
              line-height: 1.6;
            }
            .button {
              display: inline-block;
              padding: 14px 35px;
              background: #388e3c;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              box-shadow: 0 4px 12px rgba(56, 142, 60, 0.3);
            }
            .button:hover {
              background: #2e7d32;
            }
            .steps {
              background: #e8f5e9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .steps h3 {
              color: #388e3c;
              margin-top: 0;
            }
            .steps ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .steps li {
              margin: 10px 0;
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
            <div class="icon">🚫</div>
            <h1>Product Submission Rejected</h1>
          </div>
          <div class="content">
            <p>Dear User,</p>
            
            <p>Thank you for submitting a product to Farmers Direct marketplace.</p>
            
            <div class="alert-box">
              <h3>📦 Product Review Update</h3>
              <p>We've reviewed your product submission and unfortunately, we cannot approve it at this time.</p>
            </div>

            <div class="product-info">
              <h3>Rejected Product:</h3>
              <p>${productTitle}</p>
            </div>

            <div class="reason-box">
              <strong>Rejection Reason:</strong>
              <p>${rejectionReason}</p>
            </div>

            <div class="divider"></div>
            
            <div class="steps">
              <h3>What You Can Do:</h3>
              <ol>
                <li>Review the rejection reason carefully</li>
                <li>Make necessary improvements or corrections</li>
                <li>Submit a new product with accurate information</li>
                <li>Ensure all product details meet our quality standards</li>
              </ol>
            </div>
            
            <p style="text-align: center; margin: 25px 0;">
              You can submit a new product or browse existing products:
            </p>
            
            <div style="text-align: center;">
              <a href="${dashboardLink}" class="button">
                🌱 Visit Dashboard
              </a>
            </div>
            
            <div class="divider"></div>
            
            <p style="color: #6d4c41; font-size: 14px; margin-top: 25px;">
              <strong>Need Help?</strong><br>
              If you have any questions about the rejection reason or need assistance, please don't hesitate to contact our support team.
            </p>
            
            <p style="margin-top: 20px;">
              Thank you for your understanding and continued participation in Farmers Direct! 🌱
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
      Farmers Direct - Product Submission Rejected
      
      Dear User,
      
      Thank you for submitting a product to Farmers Direct marketplace.
      
      Product Review Update
      We've reviewed your product submission and unfortunately, we cannot approve it at this time.
      
      Rejected Product: ${productTitle}
      
      Rejection Reason: ${rejectionReason}
      
      What You Can Do:
      1. Review the rejection reason carefully
      2. Make necessary improvements or corrections
      3. Submit a new product with accurate information
      4. Ensure all product details meet our quality standards
      
      You can visit our dashboard to submit a new product or browse existing products.
      
      Dashboard Link: ${dashboardLink}
      
      Need Help?
      If you have any questions about the rejection reason or need assistance, please contact our support team.
      
      Thank you for your understanding and continued participation in Farmers Direct!
      
      © 2026 Farmers Direct. All rights reserved.
      This is an automated message. Please do not reply to this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Product rejection email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending product rejection email:', error);
    throw error;
  }
};

// Send delivery notification email to buyer
export const sendDeliveryNotificationEmail = async (
  buyerEmail: string,
  farmerName: string,
  buyerName: string,
  productName: string,
  balanceAmount: number,
  transactionReference: string
) => {
  const transporter = createTransporter();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const mailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: buyerEmail,
    subject: `🚚 Product Ready for Delivery - ${productName}`,
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
              background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
              border: 2px solid #ff9800;
            }
            .header h1 {
              color: #e65100;
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #fff;
              padding: 30px;
              border: 2px solid #ff9800;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .alert-box {
              background: #fff9c4;
              border: 2px solid #f57f17;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .truck-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .bank-details {
              background: #e8f5e9;
              border: 2px solid #4caf50;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .bank-details h3 {
              color: #2e7d32;
              margin-top: 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #c8e6c9;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .detail-value {
              color: #000;
              font-family: monospace;
            }
            .amount-box {
              background: #ffebee;
              border: 2px solid #d32f2f;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
            }
            .amount-box .label {
              font-size: 14px;
              color: #666;
              margin-bottom: 8px;
            }
            .amount-box .amount {
              font-size: 36px;
              font-weight: bold;
              color: #d32f2f;
            }
            .transaction-ref {
              background: #e3f2fd;
              border: 2px solid #1565c0;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .transaction-ref .ref-id {
              font-size: 20px;
              font-family: monospace;
              font-weight: bold;
              color: #1565c0;
              letter-spacing: 2px;
              background: white;
              padding: 10px;
              border-radius: 4px;
              display: inline-block;
              margin-top: 10px;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: #ff9800;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              font-size: 16px;
            }
            .button:hover {
              background: #f57c00;
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
            <div class="alert-box">
              <div class="truck-icon">🚚</div>
              <h2 style="color: #e65100; margin: 10px 0;">Product Ready for Delivery!</h2>
              <p style="color: #6d4c41; margin: 5px 0;">
                <strong>${farmerName}</strong> has notified that your order is ready for delivery.
              </p>
            </div>

            <p>Dear ${buyerName},</p>
            
            <p>Great news! The farmer has prepared your order and the product is ready for delivery:</p>
            
            <p style="font-size: 18px; color: #388e3c; font-weight: bold; text-align: center; padding: 15px; background: #e8f5e9; border-radius: 8px;">
              📦 ${productName}
            </p>

            <p><strong>Next Step: Complete Balance Payment (90%)</strong></p>
            <p>To proceed with delivery, please complete the remaining 90% balance payment using the details below:</p>

            <div class="amount-box">
              <div class="label">Balance Payment Amount (90%)</div>
              <div class="amount">${formatCurrency(balanceAmount)}</div>
            </div>

            <div class="bank-details">
              <h3>🏦 Bank Transfer Details</h3>
              <div class="detail-row">
                <span class="detail-label">Bank Name:</span>
                <span class="detail-value">State Bank of India</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Account Name:</span>
                <span class="detail-value">Farmers Direct Pvt Ltd</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Account Number:</span>
                <span class="detail-value">1234567890123456</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">IFSC Code:</span>
                <span class="detail-value">SBIN0001234</span>
              </div>
            </div>

            <div class="transaction-ref">
              <strong style="color: #1565c0;">📋 Transaction Reference</strong>
              <br/>
              <small style="color: #666;">(Use this in your payment remarks)</small>
              <div class="ref-id">${transactionReference}</div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">
                💰 Submit Balance Payment
              </a>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Make the payment to the bank account mentioned above</li>
                <li>Use the transaction reference in your payment remarks</li>
                <li>Upload payment screenshot in your account dashboard</li>
                <li>Delivery will proceed after payment verification</li>
              </ul>
            </div>

            <p style="margin-top: 30px;">If you have any questions, please contact us immediately.</p>
            
            <p style="margin-top: 20px;">
              Best regards,<br/>
              <strong>Farmers Direct Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Farmers Direct.</p>
            <p>© 2026 Farmers Direct. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Product Ready for Delivery - Farmers Direct

Dear ${buyerName},

Great news! ${farmerName} has notified that your order is ready for delivery.

Product: ${productName}

Next Step: Complete Balance Payment (90%)

Balance Amount: ${formatCurrency(balanceAmount)}

Bank Transfer Details:
- Bank Name: State Bank of India
- Account Name: Farmers Direct Pvt Ltd
- Account Number: 1234567890123456
- IFSC Code: SBIN0001234

Transaction Reference (use in payment remarks): ${transactionReference}

Please:
1. Make the payment to the above bank account
2. Use the transaction reference in your payment remarks
3. Upload payment screenshot in your account dashboard
4. Delivery will proceed after payment verification

Login to your account to submit the balance payment:
${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login

If you have any questions, please contact us immediately.

Best regards,
Farmers Direct Team

---
This is an automated notification from Farmers Direct.
© 2026 Farmers Direct. All rights reserved.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Delivery notification email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending delivery notification email:', error);
    throw error;
  }
};

// Send interaction acceptance email (when both parties accept)
export const sendInteractionAcceptanceEmail = async (
  farmerEmail: string,
  buyerEmail: string,
  farmerName: string,
  buyerName: string,
  productName: string,
  interactionType: string
) => {
  const transporter = createTransporter();

  const interactionTypeLabel = interactionType === 'express_interest' 
    ? 'Express Interest' 
    : interactionType === 'request_sample' 
    ? 'Sample Request' 
    : 'Shortlist';

  // Email to Farmer
  const farmerMailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: farmerEmail,
    subject: `✅ Mutual Acceptance - ${productName}`,
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
            .highlight-box {
              background: #fff9c4;
              border: 2px solid #f57f17;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
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
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6d4c41;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌱 Farmers Direct</h1>
          </div>
          <div class="content">
            <h2 style="color: #388e3c;">🎉 Great News!</h2>
            <p>Dear ${farmerName},</p>
            <p>Both you and the buyer have accepted the interaction!</p>
            
            <div class="highlight-box">
              <h3 style="color: #f57f17; margin: 0 0 10px 0;">Mutual Acceptance Achieved</h3>
              <p style="margin: 0;"><strong>Product:</strong> ${productName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Buyer:</strong> ${buyerName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Interaction Type:</strong> ${interactionTypeLabel}</p>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Log in to your account to proceed with contract creation</li>
              <li>Click "Enter into Contract" to generate a legal agreement</li>
              <li>Review and sign the contract to finalize the deal</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="button">
                📋 View Dashboard
              </a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Farmers Direct. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Farmers Direct - Mutual Acceptance
      
      Dear ${farmerName},
      
      Great News! Both you and the buyer have accepted the interaction!
      
      Details:
      - Product: ${productName}
      - Buyer: ${buyerName}
      - Interaction Type: ${interactionTypeLabel}
      
      Next Steps:
      - Log in to your account to proceed with contract creation
      - Click "Enter into Contract" to generate a legal agreement
      - Review and sign the contract to finalize the deal
      
      Visit: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login
      
      © 2026 Farmers Direct. All rights reserved.
    `,
  };

  // Email to Buyer
  const buyerMailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: buyerEmail,
    subject: `✅ Mutual Acceptance - ${productName}`,
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
            .highlight-box {
              background: #e3f2fd;
              border: 2px solid #1565c0;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #2196f3;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6d4c41;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌱 Farmers Direct</h1>
          </div>
          <div class="content">
            <h2 style="color: #2196f3;">🎉 Great News!</h2>
            <p>Dear ${buyerName},</p>
            <p>Both you and the farmer have accepted the interaction!</p>
            
            <div class="highlight-box">
              <h3 style="color: #1565c0; margin: 0 0 10px 0;">Mutual Acceptance Achieved</h3>
              <p style="margin: 0;"><strong>Product:</strong> ${productName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Farmer:</strong> ${farmerName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Interaction Type:</strong> ${interactionTypeLabel}</p>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Log in to your account to proceed with contract creation</li>
              <li>Either party can click "Enter into Contract" to generate a legal agreement</li>
              <li>Review and sign the contract to finalize the purchase</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="button">
                📋 View Dashboard
              </a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Farmers Direct. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Farmers Direct - Mutual Acceptance
      
      Dear ${buyerName},
      
      Great News! Both you and the farmer have accepted the interaction!
      
      Details:
      - Product: ${productName}
      - Farmer: ${farmerName}
      - Interaction Type: ${interactionTypeLabel}
      
      Next Steps:
      - Log in to your account to proceed with contract creation
      - Either party can click "Enter into Contract" to generate a legal agreement
      - Review and sign the contract to finalize the purchase
      
      Visit: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login
      
      © 2026 Farmers Direct. All rights reserved.
    `,
  };

  try {
    await Promise.all([
      transporter.sendMail(farmerMailOptions),
      transporter.sendMail(buyerMailOptions)
    ]);
    console.log('Interaction acceptance emails sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending interaction acceptance emails:', error);
    throw error;
  }
};

// Send contract fully signed email (when both parties sign)
export const sendContractSignedEmail = async (
  farmerEmail: string,
  buyerEmail: string,
  farmerName: string,
  buyerName: string,
  productName: string,
  contractPdf?: Buffer
) => {
  const transporter = createTransporter();

  // Prepare PDF attachment if provided
  const attachments = contractPdf ? [{
    filename: `Contract_${productName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
    content: contractPdf,
    contentType: 'application/pdf'
  }] : [];

  // Email to Farmer
  const farmerMailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: farmerEmail,
    subject: `📝 Contract Fully Signed - ${productName}`,
    attachments: attachments,
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
            .success-box {
              background: #e8f5e9;
              border: 2px solid #4caf50;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #ff9800;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6d4c41;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌱 Farmers Direct</h1>
          </div>
          <div class="content">
            <h2 style="color: #388e3c;">🎊 Contract Fully Signed!</h2>
            <p>Dear ${farmerName},</p>
            <p>Great news! The contract has been signed by both parties.</p>
            
            <div class="success-box">
              <h3 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 2rem;">✅ ✅</h3>
              <h3 style="color: #2e7d32; margin: 0 0 10px 0;">Contract Executed</h3>
              <p style="margin: 0;"><strong>Product:</strong> ${productName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Buyer:</strong> ${buyerName}</p>
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
                Status updated to: <strong style="color: #01579b;">Payment Phase</strong>
              </p>
            </div>

            <p><strong>📎 Signed Contract Attached</strong></p>
            <p style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 10px; margin: 15px 0;">
              A PDF copy of the fully executed contract is attached to this email for your records.
            </p>

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>The transaction has moved to the payment phase</li>
              <li>Log in to your account to view the contract and proceed with payment</li>
              <li>Keep the attached PDF for your records</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="button">
                💳 Proceed to Payment
              </a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Farmers Direct. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Farmers Direct - Contract Fully Signed
      
      Dear ${farmerName},
      
      Great News! The contract has been signed by both parties.
      
      Details:
      - Product: ${productName}
      - Buyer: ${buyerName}
      - Status: Payment Phase
      
      📎 SIGNED CONTRACT ATTACHED
      A PDF copy of the fully executed contract is attached to this email.
      
      Next Steps:
      - The transaction has moved to the payment phase
      - Log in to your account to view the contract and proceed with payment
      - Keep the attached PDF for your records
      
      Visit: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login
      
      © 2026 Farmers Direct. All rights reserved.
    `,
  };

  // Email to Buyer
  const buyerMailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: buyerEmail,
    subject: `📝 Contract Fully Signed - ${productName}`,
    attachments: attachments,
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
            .success-box {
              background: #e8f5e9;
              border: 2px solid #4caf50;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #ff9800;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6d4c41;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌱 Farmers Direct</h1>
          </div>
          <div class="content">
            <h2 style="color: #2196f3;">🎊 Contract Fully Signed!</h2>
            <p>Dear ${buyerName},</p>
            <p>Great news! The contract has been signed by both parties.</p>
            
            <div class="success-box">
              <h3 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 2rem;">✅ ✅</h3>
              <h3 style="color: #2e7d32; margin: 0 0 10px 0;">Contract Executed</h3>
              <p style="margin: 0;"><strong>Product:</strong> ${productName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Farmer:</strong> ${farmerName}</p>
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
                Status updated to: <strong style="color: #01579b;">Payment Phase</strong>
              </p>
            </div>

            <p><strong>📎 Signed Contract Attached</strong></p>
            <p style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 10px; margin: 15px 0;">
              A PDF copy of the fully executed contract is attached to this email for your records.
            </p>

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>The transaction has moved to the payment phase</li>
              <li>Log in to your account to proceed with payment</li>
              <li>Keep the attached PDF for your records</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="button">
                💳 Proceed to Payment
              </a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Farmers Direct. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Farmers Direct - Contract Fully Signed
      
      Dear ${buyerName},
      
      Great News! The contract has been signed by both parties.
      
      📎 SIGNED CONTRACT ATTACHED
      A PDF copy of the fully executed contract is attached to this email.
      
      Details:
      - Product: ${productName}
      - Farmer: ${farmerName}
      - Status: Payment Phase
      
      Next Steps:
      - The transaction has moved to the payment phase
      - Log in to your account to proceed with payment
      - Keep the attached PDF for your records
      
      Visit: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login
      
      © 2026 Farmers Direct. All rights reserved.
    `,
  };

  try {
    await Promise.all([
      transporter.sendMail(farmerMailOptions),
      transporter.sendMail(buyerMailOptions)
    ]);
    console.log('Contract signed emails sent successfully with PDF attachment');
    return { success: true };
  } catch (error) {
    console.error('Error sending contract signed emails:', error);
    throw error;
  }
};

// Send contract PDF email when payment is approved
export const sendContractPdfEmail = async (
  farmerEmail: string,
  buyerEmail: string,
  farmerName: string,
  buyerName: string,
  productName: string,
  contractPdfBuffer: Buffer,
  transactionDetails?: {
    transactionId: string;
    totalAmount: number;
    advanceAmount: number;
    paymentDate?: string;
  }
) => {
  const transporter = createTransporter();

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Format currency for Indian Rupees
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const balanceAmount = transactionDetails ? transactionDetails.totalAmount - transactionDetails.advanceAmount : 0;

  // Email to Farmer
  const farmerMailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: farmerEmail,
    subject: `📋 Contract Agreement - ${productName}`,
    attachments: [
      {
        filename: `Contract_${productName.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
        content: contractPdfBuffer,
        contentType: 'application/pdf',
      },
    ],
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
              background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
              padding: 30px;
              text-align: center;
              border-radius: 12px 12px 0 0;
            }
            .header h1 {
              color: #2e7d32;
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: white;
              padding: 30px;
              border-left: 4px solid #388e3c;
              border-right: 4px solid #388e3c;
            }
            .highlight-box {
              background: #fff9c4;
              border-left: 4px solid #f57f17;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box {
              background: #e3f2fd;
              border: 2px solid #2196f3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
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
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6d4c41;
              font-size: 12px;
              background: #f5f5f5;
              padding: 20px;
              border-radius: 0 0 12px 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌱 Farmers Direct</h1>
            <p style="margin: 10px 0 0 0; color: #388e3c;">Contract Agreement Ready</p>
          </div>
          <div class="content">
            <h2 style="color: #388e3c;">📋 Official Contract Agreement</h2>
            <p>Dear ${farmerName},</p>
            <p>Great news! The buyer has completed the 10% advance payment, and your contract agreement is now ready.</p>
            
            <div class="highlight-box">
              <h3 style="color: #f57f17; margin: 0 0 10px 0;">Payment Verified ✅</h3>
              <p style="margin: 0;"><strong>Product:</strong> ${productName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Buyer:</strong> ${buyerName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Ready for Delivery</p>
            </div>

            ${transactionDetails ? `
            <div class="info-box">
              <h3 style="color: #1565c0; margin: 0 0 15px 0;">💳 Transaction Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Transaction ID:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-family: monospace; color: #1976d2;">${transactionDetails.transactionId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Total Contract Value:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${formatCurrency(transactionDetails.totalAmount)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>10% Advance Payment:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; color: #d32f2f; font-weight: bold;">${formatCurrency(transactionDetails.advanceAmount)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>90% Balance Payment:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; color: #2e7d32; font-weight: bold;">${formatCurrency(balanceAmount)}</td>
                </tr>
                ${transactionDetails.paymentDate ? `
                <tr>
                  <td style="padding: 8px 0;"><strong>Payment Date:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${new Date(transactionDetails.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                ` : ''}
              </table>
              <p style="margin: 15px 0 0 0; padding: 10px; background: #fff3cd; border-left: 3px solid #ffc107; font-size: 14px;">
                <strong>⚠️ Important:</strong> Balance amount (${formatCurrency(balanceAmount)}) must be paid before delivery.
              </p>
            </div>
            ` : ''}

            <div class="info-box">${transactionDetails ? '' : `
              <p style="margin: 0; font-weight: bold; color: #1565c0;">📎 Contract PDF Attached</p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">
                Please find the official contract agreement attached to this email. This document includes:
              </p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Complete terms and conditions</li>
                <li>Both party signatures</li>
                <li>Company authorization and witness</li>
                <li>Official Farmers Direct seal</li>
              </ul>
            `}
            </div>

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Review the attached contract PDF</li>
              <li>Prepare the product for delivery</li>
              <li>Coordinate with the buyer for pickup/delivery</li>
              <li>Complete the transaction as per agreement</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="button">
                📊 View Dashboard
              </a>
            </div>

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              <strong>Important:</strong> Keep this contract PDF for your records. It serves as legal proof of the transaction.
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
      Farmers Direct - Contract Agreement Ready
      
      Dear ${farmerName},
      
      Great news! The buyer has completed the 10% advance payment, and your contract agreement is now ready.
      
      Product: ${productName}
      Buyer: ${buyerName}
      Status: Ready for Delivery
      Date: ${today}
      ${transactionDetails ? `
      
      TRANSACTION DETAILS:
      Transaction ID: ${transactionDetails.transactionId}
      Total Contract Value: ${formatCurrency(transactionDetails.totalAmount)}
      10% Advance Payment: ${formatCurrency(transactionDetails.advanceAmount)}
      90% Balance Payment: ${formatCurrency(balanceAmount)}
      ${transactionDetails.paymentDate ? `Payment Date: ${new Date(transactionDetails.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
      
      IMPORTANT: Balance amount (${formatCurrency(balanceAmount)}) must be paid before delivery.
      ` : ''}
      
      The official contract PDF is attached to this email. It includes:
      - Complete terms and conditions
      - Both party signatures
      - Company authorization and witness
      - Official Farmers Direct seal
      
      Next Steps:
      1. Review the attached contract PDF
      2. Prepare the product for delivery
      3. Coordinate with the buyer for pickup/delivery
      4. Complete the transaction as per agreement
      
      Dashboard: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login
      
      Important: Keep this contract PDF for your records.
      
      © 2026 Farmers Direct. All rights reserved.
    `,
  };

  // Email to Buyer
  const buyerMailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: buyerEmail,
    subject: `📋 Contract Agreement - ${productName}`,
    attachments: [
      {
        filename: `Contract_${productName.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
        content: contractPdfBuffer,
        contentType: 'application/pdf',
      },
    ],
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
              background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
              padding: 30px;
              text-align: center;
              border-radius: 12px 12px 0 0;
            }
            .header h1 {
              color: #1565c0;
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: white;
              padding: 30px;
              border-left: 4px solid #2196f3;
              border-right: 4px solid #2196f3;
            }
            .highlight-box {
              background: #fff9c4;
              border-left: 4px solid #f57f17;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box {
              background: #e8f5e9;
              border: 2px solid #4caf50;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #2196f3;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6d4c41;
              font-size: 12px;
              background: #f5f5f5;
              padding: 20px;
              border-radius: 0 0 12px 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌱 Farmers Direct</h1>
            <p style="margin: 10px 0 0 0; color: #1565c0;">Contract Agreement Ready</p>
          </div>
          <div class="content">
            <h2 style="color: #2196f3;">📋 Official Contract Agreement</h2>
            <p>Dear ${buyerName},</p>
            <p>Your payment has been verified! Your contract agreement is now ready.</p>
            
            <div class="highlight-box">
              <h3 style="color: #f57f17; margin: 0 0 10px 0;">Payment Confirmed ✅</h3>
              <p style="margin: 0;"><strong>Product:</strong> ${productName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Seller:</strong> ${farmerName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Awaiting Delivery</p>
            </div>

            ${transactionDetails ? `
            <div class="info-box" style="background: #e8f5e9;">
              <h3 style="color: #2e7d32; margin: 0 0 15px 0;">💳 Transaction Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9;"><strong>Transaction ID:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9; text-align: right; font-family: monospace; color: #1976d2;">${transactionDetails.transactionId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9;"><strong>Total Contract Value:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9; text-align: right; font-weight: bold;">${formatCurrency(transactionDetails.totalAmount)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9;"><strong>10% Advance Paid:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9; text-align: right; color: #2e7d32; font-weight: bold;">${formatCurrency(transactionDetails.advanceAmount)} ✅</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9;"><strong>Remaining Balance (90%):</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9; text-align: right; color: #d32f2f; font-weight: bold;">${formatCurrency(balanceAmount)}</td>
                </tr>
                ${transactionDetails.paymentDate ? `
                <tr>
                  <td style="padding: 8px 0;"><strong>Payment Date:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${new Date(transactionDetails.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                ` : ''}
              </table>
              <p style="margin: 15px 0 0 0; padding: 10px; background: #fff9c4; border-left: 3px solid #f57f17; font-size: 14px;">
                <strong>📌 Reminder:</strong> Please complete the balance payment of ${formatCurrency(balanceAmount)} before delivery as per contract terms.
              </p>
            </div>
            ` : ''}

            <div class="info-box">${transactionDetails ? '' : `
              <p style="margin: 0; font-weight: bold; color: #2e7d32;">📎 Contract PDF Attached</p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">
                Please find the official contract agreement attached to this email. This document includes:
              </p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Complete terms and conditions</li>
                <li>Both party signatures</li>
                <li>Company authorization and witness</li>
                <li>Official Farmers Direct seal</li>
              </ul>
            `}
            </div>

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Review the attached contract PDF</li>
              <li>Coordinate with the farmer for delivery</li>
              <li>Complete remaining payment upon delivery</li>
              <li>Provide feedback after transaction</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="button">
                📊 View Dashboard
              </a>
            </div>

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              <strong>Important:</strong> Keep this contract PDF for your records. It serves as legal proof of the transaction.
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
      Farmers Direct - Contract Agreement Ready
      
      Dear ${buyerName},
      
      Your payment has been verified! Your contract agreement is now ready.
      
      Product: ${productName}
      Seller: ${farmerName}
      Status: Awaiting Delivery
      Date: ${today}
      ${transactionDetails ? `
      
      TRANSACTION DETAILS:
      Transaction ID: ${transactionDetails.transactionId}
      Total Contract Value: ${formatCurrency(transactionDetails.totalAmount)}
      10% Advance Paid: ${formatCurrency(transactionDetails.advanceAmount)} ✅
      Remaining Balance (90%): ${formatCurrency(balanceAmount)}
      ${transactionDetails.paymentDate ? `Payment Date: ${new Date(transactionDetails.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
      
      REMINDER: Please complete the balance payment of ${formatCurrency(balanceAmount)} before delivery as per contract terms.
      ` : ''}
      
      The official contract PDF is attached to this email. It includes:
      - Complete terms and conditions
      - Both party signatures
      - Company authorization and witness
      - Official Farmers Direct seal
      
      Next Steps:
      1. Review the attached contract PDF
      2. Coordinate with the farmer for delivery
      3. Complete remaining payment upon delivery
      4. Provide feedback after transaction
      
      Dashboard: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login
      
      Important: Keep this contract PDF for your records.
      
      © 2026 Farmers Direct. All rights reserved.
    `,
  };

  try {
    await Promise.all([
      transporter.sendMail(farmerMailOptions),
      transporter.sendMail(buyerMailOptions)
    ]);
    console.log('Contract PDF emails sent successfully to both parties');
    return { success: true };
  } catch (error) {
    console.error('Error sending contract PDF emails:', error);
    throw error;
  }
};

// Send goods delivered notification to buyer
export const sendGoodsDeliveredEmail = async (
  buyerEmail: string,
  farmerName: string,
  buyerName: string,
  productName: string,
  balanceAmount: number,
  transactionId: string
) => {
  const transporter = createTransporter();
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const mailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: buyerEmail,
    subject: `🚚 Goods Delivered - Action Required: Confirm Receipt - Farmers Direct`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .highlight-box { background: #fff9c4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f57f17; }
            .info-box { background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #43a047; }
            .button { display: inline-block; background: #ff9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚚 Goods Delivered</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${buyerName}</strong>,</p>
            
            <p>Good news! The farmer has marked your order as <strong>delivered</strong>.</p>
            
            <div class="highlight-box">
              <h3 style="color: #f57f17; margin: 0 0 10px 0;">⏳ Action Required</h3>
              <p style="margin: 0; font-size: 16px; font-weight: bold;">Please confirm receipt of goods and release the balance payment to the farmer.</p>
            </div>

            <div class="info-box">
              <h3 style="color: #2e7d32; margin: 0 0 15px 0;">📦 Delivery Details</h3>
              <p style="margin: 5px 0;"><strong>Product:</strong> ${productName}</p>
              <p style="margin: 5px 0;"><strong>Farmer:</strong> ${farmerName}</p>
              <p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${today}</p>
              <p style="margin: 5px 0;"><strong>Balance Amount:</strong> <span style="color: #d32f2f; font-weight: bold; font-size: 18px;">${formatCurrency(balanceAmount)}</span></p>
              <p style="margin: 5px 0;"><strong>Transaction ID:</strong> <code style="background: #e3f2fd; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${transactionId}</code></p>
            </div>

            <p><strong>What to do next:</strong></p>
            <ol style="line-height: 1.8;">
              <li>Verify that you have received the goods in good condition</li>
              <li>Log in to your Farmers Direct account</li>
              <li>Click on "Confirm Delivery & Release Payment"</li>
              <li>The balance payment will be released to the farmer</li>
            </ol>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="button">
                ✅ Confirm Receipt & Release Payment
              </a>
            </div>

            <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #d32f2f;">
              <p style="margin: 0; font-size: 14px;">
                <strong>⚠️ Important:</strong> Please confirm receipt only if you have actually received the goods and verified their condition. Once confirmed, the balance payment will be released to the farmer.
              </p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Farmers Direct. All rights reserved.</p>
            <p style="margin-top: 10px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Farmers Direct - Goods Delivered
      
      Dear ${buyerName},
      
      Good news! The farmer has marked your order as delivered.
      
      ACTION REQUIRED: Please confirm receipt of goods and release the balance payment to the farmer.
      
      DELIVERY DETAILS:
      Product: ${productName}
      Farmer: ${farmerName}
      Delivery Date: ${today}
      Balance Amount: ${formatCurrency(balanceAmount)}
      Transaction ID: ${transactionId}
      
      What to do next:
      1. Verify that you have received the goods in good condition
      2. Log in to your Farmers Direct account
      3. Click on "Confirm Delivery & Release Payment"
      4. The balance payment will be released to the farmer
      
      Dashboard: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login
      
      IMPORTANT: Please confirm receipt only if you have actually received the goods and verified their condition. Once confirmed, the balance payment will be released to the farmer.
      
      © 2026 Farmers Direct. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Goods delivered notification email sent successfully to buyer');
    return { success: true };
  } catch (error) {
    console.error('Error sending goods delivered notification email:', error);
    throw error;
  }
};

// Send payment released notification to farmer
export const sendPaymentReleasedEmail = async (
  farmerEmail: string,
  buyerName: string,
  farmerName: string,
  productName: string,
  balanceAmount: number,
  transactionId: string
) => {
  const transporter = createTransporter();
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const mailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: farmerEmail,
    subject: `🎉 Payment Released - Transaction Completed - Farmers Direct`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .success-box { background: #e8f5e9; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #43a047; text-align: center; }
            .info-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #43a047; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Payment Released!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${farmerName}</strong>,</p>
            
            <p>Congratulations! The buyer has confirmed receipt of the goods, and the balance payment has been released.</p>
            
            <div class="success-box">
              <div style="font-size: 48px; margin-bottom: 10px;">💰</div>
              <h2 style="color: #2e7d32; margin: 0 0 10px 0;">Payment Released Successfully</h2>
              <p style="font-size: 28px; font-weight: bold; color: #2e7d32; margin: 10px 0;">${formatCurrency(balanceAmount)}</p>
              <p style="margin: 5px 0; color: #666;">Transaction completed on ${today}</p>
            </div>

            <div class="info-box">
              <h3 style="color: #2e7d32; margin: 0 0 15px 0;">📋 Transaction Summary</h3>
              <p style="margin: 5px 0;"><strong>Product:</strong> ${productName}</p>
              <p style="margin: 5px 0;"><strong>Buyer:</strong> ${buyerName}</p>
              <p style="margin: 5px 0;"><strong>Balance Amount:</strong> <span style="color: #2e7d32; font-weight: bold;">${formatCurrency(balanceAmount)}</span></p>
              <p style="margin: 5px 0;"><strong>Transaction ID:</strong> <code style="background: #e3f2fd; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${transactionId}</code></p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #43a047; font-weight: bold;">✅ Completed</span></p>
            </div>

            <p><strong>What happens next:</strong></p>
            <ul style="line-height: 1.8;">
              <li>The payment will be processed within 2-3 business days</li>
              <li>You will receive the funds in your registered bank account</li>
              <li>You can view the transaction details in your dashboard</li>
              <li>Thank you for using Farmers Direct!</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="button">
                📊 View Dashboard
              </a>
            </div>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #1976d2;">
              <p style="margin: 0; font-size: 14px;">
                <strong>💡 Tip:</strong> Keep providing quality products to build your reputation on Farmers Direct and attract more buyers!
              </p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Farmers Direct. All rights reserved.</p>
            <p style="margin-top: 10px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Farmers Direct - Payment Released!
      
      Dear ${farmerName},
      
      Congratulations! The buyer has confirmed receipt of the goods, and the balance payment has been released.
      
      PAYMENT RELEASED: ${formatCurrency(balanceAmount)}
      
      TRANSACTION SUMMARY:
      Product: ${productName}
      Buyer: ${buyerName}
      Balance Amount: ${formatCurrency(balanceAmount)}
      Transaction ID: ${transactionId}
      Status: ✅ Completed
      Date: ${today}
      
      What happens next:
      1. The payment will be processed within 2-3 business days
      2. You will receive the funds in your registered bank account
      3. You can view the transaction details in your dashboard
      4. Thank you for using Farmers Direct!
      
      Dashboard: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login
      
      TIP: Keep providing quality products to build your reputation on Farmers Direct and attract more buyers!
      
      © 2026 Farmers Direct. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Payment released notification email sent successfully to farmer');
    return { success: true };
  } catch (error) {
    console.error('Error sending payment released notification email:', error);
    throw error;
  }
};

/**
 * Send email notification when balance payment is approved by admin/owner
 */
export const sendBalancePaymentApprovedEmail = async (
  farmerEmail: string,
  buyerName: string,
  farmerName: string,
  productName: string,
  balanceAmount: number,
  transactionId: string
) => {
  const transporter = createTransporter();
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const mailOptions = {
    from: `"Farmers Direct" <${process.env.EMAIL_USER}>`,
    to: farmerEmail,
    subject: `✅ Balance Payment Approved - Ready for Delivery - Farmers Direct`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .success-box { background: #e8f5e9; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #43a047; text-align: center; }
            .info-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .action-box { background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800; }
            .button { display: inline-block; background: #43a047; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Balance Payment Approved!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${farmerName}</strong>,</p>
            
            <p>Great news! The balance payment for your transaction with <strong>${buyerName}</strong> has been verified and approved by our admin team.</p>
            
            <div class="success-box">
              <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
              <h2 style="color: #2e7d32; margin: 0 0 10px 0;">Payment Approved</h2>
              <p style="font-size: 28px; font-weight: bold; color: #2e7d32; margin: 10px 0;">${formatCurrency(balanceAmount)}</p>
              <p style="margin: 5px 0; color: #666;">Verified on ${today}</p>
            </div>

            <div class="info-box">
              <h3 style="color: #2e7d32; margin: 0 0 15px 0;">📋 Transaction Details</h3>
              <p style="margin: 5px 0;"><strong>Product:</strong> ${productName}</p>
              <p style="margin: 5px 0;"><strong>Buyer:</strong> ${buyerName}</p>
              <p style="margin: 5px 0;"><strong>Balance Amount:</strong> <span style="color: #2e7d32; font-weight: bold;">${formatCurrency(balanceAmount)}</span></p>
              <p style="margin: 5px 0;"><strong>Transaction ID:</strong> <code style="background: #e3f2fd; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${transactionId}</code></p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold;">⏳ Awaiting Delivery</span></p>
            </div>

            <div class="action-box">
              <h3 style="color: #f57c00; margin: 0 0 15px 0;">⚡ Next Steps - Action Required</h3>
              <p style="margin: 0 0 15px 0;"><strong>You need to mark the goods as delivered once you ship/deliver the product to the buyer.</strong></p>
              
              <ol style="line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Prepare and deliver the goods to the buyer</li>
                <li>Go to your dashboard and click on <strong>"🚚 Notify as Product Delivered"</strong> button</li>
                <li>The buyer will be notified to confirm receipt</li>
                <li>Once buyer confirms, your payment will be released automatically</li>
              </ol>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="button">
                🚚 Go to Dashboard & Mark Delivered
              </a>
            </div>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #1976d2;">
              <p style="margin: 0; font-size: 14px;">
                <strong>💡 Important:</strong> Remember to mark the goods as delivered only after you've actually shipped/delivered them to the buyer. Once you notify delivery, the buyer will confirm receipt, and your payment will be released.
              </p>
            </div>

            <p style="margin-top: 20px;"><strong>Payment Release Process:</strong></p>
            <ul style="line-height: 1.8;">
              <li>✅ Balance payment verified (Current step)</li>
              <li>⏩ You mark goods as delivered (Next step)</li>
              <li>⏩ Buyer confirms receipt</li>
              <li>⏩ Payment released to you automatically</li>
            </ul>
          </div>
          <div class="footer">
            <p>&copy; 2026 Farmers Direct. All rights reserved.</p>
            <p style="margin-top: 10px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Farmers Direct - Balance Payment Approved!
      
      Dear ${farmerName},
      
      Great news! The balance payment for your transaction with ${buyerName} has been verified and approved by our admin team.
      
      PAYMENT APPROVED: ${formatCurrency(balanceAmount)}
      
      TRANSACTION DETAILS:
      Product: ${productName}
      Buyer: ${buyerName}
      Balance Amount: ${formatCurrency(balanceAmount)}
      Transaction ID: ${transactionId}
      Status: ⏳ Awaiting Delivery
      Verified on: ${today}
      
      NEXT STEPS - ACTION REQUIRED:
      You need to mark the goods as delivered once you ship/deliver the product to the buyer.
      
      1. Prepare and deliver the goods to the buyer
      2. Go to your dashboard and click on "🚚 Notify as Product Delivered" button
      3. The buyer will be notified to confirm receipt
      4. Once buyer confirms, your payment will be released automatically
      
      Dashboard: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login
      
      PAYMENT RELEASE PROCESS:
      ✅ Balance payment verified (Current step)
      ⏩ You mark goods as delivered (Next step)
      ⏩ Buyer confirms receipt
      ⏩ Payment released to you automatically
      
      IMPORTANT: Remember to mark the goods as delivered only after you've actually shipped/delivered them to the buyer.
      
      © 2026 Farmers Direct. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Balance payment approved notification email sent successfully to farmer');
    return { success: true };
  } catch (error) {
    console.error('Error sending balance payment approved notification email:', error);
    throw error;
  }
};
// Helper function to format currency (already defined in sendDeliveryNotificationEmail)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

