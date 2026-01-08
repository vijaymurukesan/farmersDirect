import { NextRequest, NextResponse } from 'next/server';
import { sendProductRejectionEmail } from '@/app/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const { email, productTitle, rejectionReason, userType } = await req.json();

    if (!email || !productTitle || !rejectionReason) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Send the product rejection email
    await sendProductRejectionEmail(
      email,
      productTitle,
      rejectionReason,
      userType || 'user'
    );

    return NextResponse.json({
      success: true,
      message: 'Product rejection email sent successfully'
    });

  } catch (error) {
    console.error('Error sending product rejection email:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send product rejection email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
