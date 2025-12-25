import clientPromise from '@/app/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET - Fetch all verification documents
export async function GET(req: NextRequest) {
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

    // Get userId from query params if provided
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Build query filter
    const query: any = {};
    if (userId) {
      query.userId = new ObjectId(userId);
    }

    // Fetch verification documents (filtered by userId if provided)
    const verificationDocs = await db.collection('verification-docs')
      .find(query)
      .toArray();

    // If userId was provided, return single document or null
    if (userId) {
      const userDoc = verificationDocs.length > 0 ? verificationDocs[0] : null;
      return NextResponse.json({
        success: true,
        data: userDoc
      });
    }

    // Otherwise return all documents (for admin)
    return NextResponse.json({
      success: true,
      data: verificationDocs
    });

  } catch (error) {
    console.error('Error fetching verification documents:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch verification documents',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH - Update document verification status
export async function PATCH(req: NextRequest) {
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

    const { userId, documentType, action, adminEmail } = await req.json();

    if (!userId || !documentType || !action || !adminEmail) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({
        success: false,
        message: 'Invalid action. Must be "accept" or "reject"'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Update the specific document's verification status
    const result = await db.collection('verification-docs').updateOne(
      { 
        userId: new ObjectId(userId),
        'documents.documentType': documentType
      },
      {
        $set: {
          'documents.$.verified': action === 'accept',
          'documents.$.verifiedBy': adminEmail,
          'documents.$.verifiedAt': new Date(),
          'documents.$.status': action === 'accept' ? 'verified' : 'rejected',
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Document not found'
      }, { status: 404 });
    }

    // Check if all documents are verified for this user
    const verificationDoc = await db.collection('verification-docs').findOne({
      userId: new ObjectId(userId)
    });

    if (verificationDoc) {
      const allVerified = verificationDoc.documents.every((doc: any) => doc.verified === true);
      const anyRejected = verificationDoc.documents.some((doc: any) => doc.status === 'rejected');

      // Update user's document status
      let documentStatus = 'pending';
      if (allVerified) {
        documentStatus = 'verified';
      } else if (anyRejected) {
        documentStatus = 'rejected';
      }

      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            documentStatus,
            updatedAt: new Date()
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Document ${action}ed successfully`
    });

  } catch (error) {
    console.error('Error updating document verification:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update document verification',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
