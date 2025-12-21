import clientPromise from '@/app/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { hashEmailForSearch } from '@/app/lib/encryption';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Verification token is required'
      }, { status: 400 });
    }

    // Verify the token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired verification token'
      }, { status: 400 });
    }

    // Check if token is for email verification
    if (decoded.purpose !== 'email-verification') {
      return NextResponse.json({
        success: false,
        message: 'Invalid verification token'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Find user by userId and update emailVerified status
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { 
        $set: { 
          emailVerified: true,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
