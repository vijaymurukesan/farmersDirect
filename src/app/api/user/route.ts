import clientPromise from '@/app/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encryptEmail, hashEmailForSearch } from '@/app/lib/encryption';

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(); // Uses the DB from your URI
    
    // Parse the request body
    const userData = await req.json();
    
    // Validate required fields
    if (!userData.fullName || !userData.email || !userData.userType || !userData.password) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Create searchable hash of email for duplicate checking
    const emailHash = hashEmailForSearch(userData.email);
    
    // Check if user already exists using email hash
    const existingUser = await db.collection('users').findOne({ 
      emailHash: emailHash
    });
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists'
      }, { status: 409 });
    }
    
    // Hash the password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    // Encrypt the email address
    const encryptedEmail = encryptEmail(userData.email);
    
    // Generate unique farmer ID if user is a farmer
    let farmerId = null;
    if (userData.userType === 'farmer') {
      // Get the latest farmer to determine the next ID
      const latestFarmer = await db.collection('users')
        .find({ userType: 'farmer', farmerId: { $exists: true } })
        .sort({ farmerId: -1 })
        .limit(1)
        .toArray();
      
      if (latestFarmer.length > 0 && latestFarmer[0].farmerId) {
        // Extract the number from the latest farmer ID (e.g., "FID001" -> 1)
        const latestNumber = parseInt(latestFarmer[0].farmerId.replace('FID', ''));
        const nextNumber = latestNumber + 1;
        farmerId = `FID${String(nextNumber).padStart(3, '0')}`;
      } else {
        // First farmer
        farmerId = 'FID001';
      }
    }
    
    // Create user record
    const userRecord: Record<string, any> = {
      fullName: userData.fullName,
      dob: userData.dob,
      email: encryptedEmail, // Store encrypted email
      emailHash: emailHash, // Store hash for searching
      userType: userData.userType,
      password: hashedPassword, // Store hashed password
      emailVerified: false,
      userVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add farmerId only if user is a farmer
    if (farmerId) {
      userRecord.farmerId = farmerId;
    }
    
    // Insert the user into MongoDB
    const result = await db.collection('users').insertOne(userRecord);
    
    if (result.acknowledged) {
      // Generate JWT token
      const token = jwt.sign(
        {
          userId: result.insertedId.toString(),
          email: userData.email, // Use plain email in token
          userType: userData.userType,
          ...(farmerId && { farmerId: farmerId }) // Include farmerId in token if exists
        },
        JWT_SECRET,
        { expiresIn: '7d' } // Token expires in 7 days
      );
      
      // Prepare response data
      const responseData: Record<string, any> = {
        fullName: userRecord.fullName,
        email: userRecord.email,
        userType: userRecord.userType,
        emailVerified: userRecord.emailVerified,
        userVerified: userRecord.userVerified
      };
      
      // Add farmerId to response if exists
      if (farmerId) {
        responseData.farmerId = farmerId;
      }
      
      return NextResponse.json({
        success: true,
        message: farmerId 
          ? `Farmer registered successfully! Your Farmer ID is ${farmerId}` 
          : 'User registered successfully',
        userId: result.insertedId,
        token: token,
        data: responseData
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to register user'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get all users from the collection (excluding passwords and emailHash)
    const users = await db.collection('users')
      .find({})
      .project({ password: 0, emailHash: 0 }) // Exclude password and emailHash from results
      .toArray();
    
    // Note: Email remains encrypted in response for security
    // If you need to display emails, decrypt them on a per-need basis
    
    return NextResponse.json({
      success: true,
      data: users,
      count: users.length
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
