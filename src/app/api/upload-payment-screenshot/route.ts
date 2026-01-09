import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const interactionId = formData.get('interactionId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (!interactionId) {
      return NextResponse.json(
        { success: false, message: 'Interaction ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `payment_${interactionId}_${timestamp}_${file.name}`;
    
    // Upload to Vercel Blob
    const blob = await put(
      `payment-screenshots/${fileName}`,
      file,
      {
        access: 'public',
        addRandomSuffix: true,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Payment screenshot uploaded successfully',
        data: {
          url: blob.url,
          fileName: fileName,
          fileSize: file.size,
          fileType: file.type,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading payment screenshot:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload payment screenshot',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
