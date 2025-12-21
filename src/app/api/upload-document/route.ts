import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const farmerId = formData.get('farmerId') as string;

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided'
      }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({
        success: false,
        message: 'Document type is required'
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        message: 'File size must be less than 10MB'
      }, { status: 400 });
    }

    // Validate file type (only documents and images)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid file type. Only PDF, images, and Word documents are allowed'
      }, { status: 400 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${farmerId || decoded.userId}_${documentType.replace(/\s+/g, '_')}_${timestamp}_${sanitizedFileName}`;
    const folderPath = `verification-docs/${farmerId || decoded.userId}/${uniqueFileName}`;

    // Upload to Vercel Blob
    const blob = await put(folderPath, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('File uploaded to Vercel Blob:', blob.url);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: blob.url,
        fileName: uniqueFileName,
        fileSize: file.size,
        fileType: file.type,
        documentType: documentType,
        uploadedAt: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error uploading file to Vercel Blob:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
