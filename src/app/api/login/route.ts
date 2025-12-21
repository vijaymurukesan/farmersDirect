import clientPromise from '@/app/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { decryptEmail, hashEmailForSearch } from '@/app/lib/encryption';

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Parse the request body
    const loginData = await req.json();
    
    // Validate required fields
    if (!loginData.email || !loginData.password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }

    // Create hash of email for searching
    const emailHash = hashEmailForSearch(loginData.email);
    
    // Find user by email hash
    const user = await db.collection('users').findOne({ 
      emailHash: emailHash
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }
    
    // Decrypt the stored email to verify it matches
    const decryptedEmail = decryptEmail(user.email);
    
    // Double-check email match (case-insensitive)
    if (decryptedEmail.toLowerCase() !== loginData.email.toLowerCase().trim()) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }
    
    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: decryptedEmail, // Use decrypted email in token
        userType: user.userType
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token: token,
      data: {
        userId: user._id,
        fullName: user.fullName,
        email: decryptedEmail, // Return decrypted email to client
        userType: user.userType,
        emailVerified: user.emailVerified,
        userVerified: user.userVerified
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
