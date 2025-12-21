import clientPromise from '@/app/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { hashEmailForSearch } from '@/app/lib/encryption';
import { sendVerificationEmail } from '@/app/lib/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Invalid token'
      }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Generate email verification token (valid for 24 hours)
    const verificationToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        purpose: 'email-verification'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verification?token=${verificationToken}`;

    // Send actual email using nodemailer
    try {
      await sendVerificationEmail(decoded.email, verificationLink);
      
      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully',
        // Include link in development for backup testing
        verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined
      }, { status: 200 });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      
      // In development, still return success with link for testing
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Email sending failed, but here is the verification link for testing',
          verificationLink: verificationLink,
          warning: 'Email not sent - check email configuration'
        }, { status: 200 });
      }
      
      return NextResponse.json({
        success: false,
        message: 'Failed to send verification email. Please check email configuration.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
