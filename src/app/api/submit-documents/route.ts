import clientPromise from '@/app/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

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

    const { documentType, fileName, fileSize, fileType } = await req.json();

    if (!documentType || !fileName) {
      return NextResponse.json({
        success: false,
        message: 'Document type and file name are required'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Create document record
    const documentRecord = {
      userId: new ObjectId(decoded.userId),
      documentType,
      fileName,
      fileSize,
      fileType,
      status: 'pending',
      submittedAt: new Date(),
      verifiedAt: null,
      verifiedBy: null
    };

    // Insert document record
    await db.collection('verificationDocuments').insertOne(documentRecord);

    // Update user's document status to pending
    await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { 
        $set: { 
          documentStatus: 'pending',
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Documents submitted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error submitting documents:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
