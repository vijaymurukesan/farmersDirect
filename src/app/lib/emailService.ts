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
  contractPdfBuffer: Buffer
) => {
  const transporter = createTransporter();

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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

            <div class="info-box">
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

            <div class="info-box">
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
