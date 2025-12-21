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

    const { documents, kisanId, farmerId } = await req.json();

    console.log('Received documents:', JSON.stringify(documents, null, 2));
    console.log('Received kisanId:', kisanId);
    console.log('Received farmerId:', farmerId);

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'At least one document is required'
      }, { status: 400 });
    }

    // Validate each document
    for (const doc of documents) {
      if (!doc.documentType || !doc.fileName || !doc.fileUrl) {
        console.error('Invalid document:', doc);
        return NextResponse.json({
          success: false,
          message: 'Each document must have a type, file name, and file URL'
        }, { status: 400 });
      }
    }

    const client = await clientPromise;
    const db = client.db();

    // Create document array with verification status
    const documentArray = documents.map(doc => ({
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl, // Vercel Blob URL
      fileSize: doc.fileSize || 0,
      fileType: doc.fileType || 'unknown',
      verified: false, // Default verification status
      verifiedBy: null, // Admin who verified (null initially)
      submittedAt: new Date(),
      verifiedAt: null
    }));

    console.log('Document array to save:', JSON.stringify(documentArray, null, 2));

    // Check if verification document already exists for this user
    const existingDoc = await db.collection('verification-docs').findOne({
      userId: new ObjectId(decoded.userId)
    });

    let result;
    if (existingDoc) {
      // Update existing document by appending new documents to the array
      result = await db.collection('verification-docs').updateOne(
        { userId: new ObjectId(decoded.userId) },
        { 
          $push: { documents: { $each: documentArray } },
          $set: { 
            updatedAt: new Date(),
            ...(farmerId && { farmerId }), // Update farmerId if provided
            ...(kisanId && { kisanId }) // Update kisanId if provided
          }
        }
      );
      console.log('Updated existing document. Modified count:', result.modifiedCount);
    } else {
      // Create new document with array of documents
      const newVerificationDoc: any = {
        userId: new ObjectId(decoded.userId),
        documents: documentArray,
        submittedAt: new Date(),
        updatedAt: new Date()
      };
      
      if (farmerId) {
        newVerificationDoc.farmerId = farmerId;
      }
      
      if (kisanId) {
        newVerificationDoc.kisanId = kisanId;
      }
      
      result = await db.collection('verification-docs').insertOne(newVerificationDoc);
      console.log('Created new verification document. Inserted ID:', result.insertedId);
    }

    // Update user's document status
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
      message: 'Documents submitted successfully',
      documentsCount: documentArray.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error submitting verification documents:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
