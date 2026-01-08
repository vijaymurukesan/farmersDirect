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
    const productTitle = formData.get('productTitle') as string || 'product';

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided'
      }, { status: 400 });
    }

    // Validate file type (only images)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid file type. Only images (JPG, PNG, WEBP, GIF) are allowed'
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        message: 'File size must be less than 5MB'
      }, { status: 400 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const sanitizedProductTitle = productTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const uniqueFileName = `${sanitizedProductTitle}_${timestamp}_${sanitizedFileName}`;
    const folderPath = `product-images/${uniqueFileName}`;

    // Upload to Vercel Blob
    const blob = await put(folderPath, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('Product image uploaded to Vercel Blob:', blob.url);

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: blob.url,
        fileName: uniqueFileName,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error uploading product image:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload image'
    }, { status: 500 });
  }
}
