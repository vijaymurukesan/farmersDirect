import { NextRequest, NextResponse } from 'next/server';
import { sendDocumentRejectionEmail } from '@/app/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const { email, fullName, documentType, rejectionReason } = await req.json();

    if (!email || !fullName || !documentType || !rejectionReason) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Format document type for display
    const formatDocumentType = (type: string) => {
      return type
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    const formattedDocType = formatDocumentType(documentType);
    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verification`;

    // Send the rejection email
    await sendDocumentRejectionEmail(
      email,
      fullName,
      formattedDocType,
      rejectionReason,
      verificationLink
    );

    return NextResponse.json({
      success: true,
      message: 'Rejection email sent successfully'
    });

  } catch (error) {
    console.error('Error sending rejection email:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send rejection email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
