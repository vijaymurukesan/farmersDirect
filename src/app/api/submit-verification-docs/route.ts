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

    const { documents, kisanId, farmerId, buyerId, verificationMethod, consent, isOptional } = await req.json();

    console.log('Received documents:', JSON.stringify(documents, null, 2));
    console.log('Received kisanId:', kisanId);
    console.log('Received farmerId:', farmerId);
    console.log('Received buyerId:', buyerId);
    console.log('Verification method:', verificationMethod);
    console.log('Consent:', consent);
    console.log('isOptional:', isOptional);

    // Handle Kisan ID verification method
    if (verificationMethod === 'kisan') {
      if (!kisanId || !consent) {
        return NextResponse.json({
          success: false,
          message: 'Kisan ID and consent are required for Kisan verification'
        }, { status: 400 });
      }

      const client = await clientPromise;
      const db = client.db();

      // Check if verification document already exists for this user
      const existingDoc = await db.collection('verification-docs').findOne({
        userId: new ObjectId(decoded.userId)
      });

      let result;
      if (existingDoc) {
        // Update existing document with Kisan ID
        result = await db.collection('verification-docs').updateOne(
          { userId: new ObjectId(decoded.userId) },
          { 
            $set: { 
              kisanId: kisanId,
              verificationMethod: 'kisan',
              kisanConsent: consent,
              documentStatus: 'pending', // Add status tracking
              updatedAt: new Date(),
              ...(farmerId && { farmerId }),
              ...(buyerId && { buyerId })
            }
          }
        );
      } else {
        // Create new document with Kisan ID
        const newVerificationDoc: any = {
          userId: new ObjectId(decoded.userId),
          kisanId: kisanId,
          verificationMethod: 'kisan',
          kisanConsent: consent,
          documentStatus: 'pending', // Add status tracking
          documents: [], // Empty documents array for Kisan verification
          submittedAt: new Date(),
          updatedAt: new Date()
        };
        
        if (farmerId) {
          newVerificationDoc.farmerId = farmerId;
        }
        
        if (buyerId) {
          newVerificationDoc.buyerId = buyerId;
        }
        
        result = await db.collection('verification-docs').insertOne(newVerificationDoc);
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
        message: 'Kisan ID submitted successfully. You will receive an OTP for verification.',
        verificationMethod: 'kisan'
      }, { status: 200 });
    }

    // Regular document upload validation
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
      mandatory: isOptional === true ? false : true, // true for mandatory, false for optional
      status: 'pending', // Status: 'pending' or 'verified' or 'rejected'
      verified: false, // Default verification status (kept for backward compatibility)
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
      // Avoid duplicates: Update existing documents or add new ones
      const existingDocs = existingDoc.documents || [];
      const existingDocTypes = new Set(existingDocs.map((d: any) => d.documentType));
      
      // Separate documents into updates and new additions
      const documentsToUpdate: any[] = [];
      const documentsToAdd: any[] = [];
      
      for (const doc of documentArray) {
        if (existingDocTypes.has(doc.documentType)) {
          documentsToUpdate.push(doc);
        } else {
          documentsToAdd.push(doc);
        }
      }
      
      console.log('Documents to update:', documentsToUpdate.length, documentsToUpdate.map(d => d.documentType));
      console.log('Documents to add:', documentsToAdd.length, documentsToAdd.map(d => d.documentType));
      
      // Update existing documents individually using positional operator
      for (const doc of documentsToUpdate) {
        const updateResult = await db.collection('verification-docs').updateOne(
          { 
            userId: new ObjectId(decoded.userId),
            'documents.documentType': doc.documentType
          },
          { 
            $set: { 
              'documents.$.fileName': doc.fileName,
              'documents.$.fileUrl': doc.fileUrl,
              'documents.$.fileSize': doc.fileSize,
              'documents.$.fileType': doc.fileType,
              'documents.$.status': 'pending', // Reset to pending when reuploaded
              'documents.$.verified': false, // Reset verification status
              'documents.$.rejectionReason': null, // Clear rejection reason
              'documents.$.rejectedAt': null, // Clear rejection timestamp
              'documents.$.verifiedBy': null, // Clear verifier
              'documents.$.verifiedAt': null, // Clear verification timestamp
              'documents.$.submittedAt': new Date() // Update submission time
            }
          }
        );
        console.log(`Updated document ${doc.documentType}:`, updateResult.modifiedCount);
      }
      
      // Add new documents that don't exist and update metadata
      const updateOps: any = {
        $set: { 
          updatedAt: new Date(),
          ...(farmerId && { farmerId }), // Update farmerId if provided
          ...(buyerId && { buyerId }), // Update buyerId if provided
          ...(kisanId && { kisanId }) // Update kisanId if provided
        }
      };
      
      // Add new documents that don't exist
      if (documentsToAdd.length > 0) {
        updateOps.$push = { documents: { $each: documentsToAdd } };
      }
      
      result = await db.collection('verification-docs').updateOne(
        { userId: new ObjectId(decoded.userId) },
        updateOps
      );
      
      console.log('Updated document metadata. Modified count:', result.modifiedCount);
      console.log('Documents updated:', documentsToUpdate.length, 'Documents added:', documentsToAdd.length);
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
      
      if (buyerId) {
        newVerificationDoc.buyerId = buyerId;
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
