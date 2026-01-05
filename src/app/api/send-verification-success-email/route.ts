import { NextRequest, NextResponse } from 'next/server';
import { sendUserVerificationEmail } from '@/app/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const { email, fullName, userType } = await req.json();

    if (!email || !fullName || !userType) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: email, fullName, or userType'
      }, { status: 400 });
    }

    // Send the verification success email
    await sendUserVerificationEmail(email, fullName, userType);

    return NextResponse.json({
      success: true,
      message: 'Verification success email sent successfully'
    });

  } catch (error) {
    console.error('Error sending verification success email:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send verification success email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
