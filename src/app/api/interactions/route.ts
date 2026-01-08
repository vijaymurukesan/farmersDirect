import clientPromise from '@/app/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { decryptEmail } from '@/app/lib/encryption';
import { sendInteractionAcceptanceEmail, sendContractSignedEmail } from '@/app/lib/emailService';
import { generateContractPDF } from '@/app/lib/contractPdfGenerator';

// Helper to safely decrypt email
const safeDecryptEmail = (email: string): string => {
  if (!email) return email;
  try {
    // Check if email looks encrypted (contains : and has hex format)
    if (email.includes(':') && email.split(':').length === 2) {
      const parts = email.split(':');
      // Check if it looks like encrypted format (32 char IV + encrypted data)
      if (parts[0].length === 32 && /^[0-9a-f]+$/i.test(parts[0])) {
        return decryptEmail(email);
      }
    }
    // Return as-is if not encrypted
    return email;
  } catch (error) {
    console.error('Error decrypting email:', error);
    return email; // Return original if decryption fails
  }
};

// POST - Create a new interaction (shortlist, express interest, request sample)
export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Parse the request body
    const interactionData = await req.json();
    
    // Validate required fields
    if (!interactionData.interactionType || !interactionData.farmerId || !interactionData.buyerId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: interactionType, farmerId, buyerId'
      }, { status: 400 });
    }
    
    // Validate interaction type
    const validTypes = ['shortlist', 'express_interest', 'request_sample'];
    if (!validTypes.includes(interactionData.interactionType)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid interaction type. Must be: shortlist, express_interest, or request_sample'
      }, { status: 400 });
    }
    
    // Check if interaction already exists (prevent duplicates for same farmer-buyer-product combination)
    const existingInteraction = await db.collection('interactions').findOne({
      interactionType: interactionData.interactionType,
      farmerid: interactionData.farmerId,
      buyerid: interactionData.buyerId,
      'product.productId': interactionData.productId
    });
    
    if (existingInteraction) {
      return NextResponse.json({
        success: false,
        message: `You have already ${interactionData.interactionType.replace('_', ' ')} this farmer for this product`
      }, { status: 409 });
    }
    
    // Create interaction record with detailed information
    const interactionRecord = {
      interactionType: interactionData.interactionType, // 'shortlist', 'express_interest', 'request_sample'
      
      // Top-level IDs for easy querying
      farmerid: interactionData.farmerId,
      buyerid: interactionData.buyerId,
      
      // Farmer Information
      farmer: {
        farmerId: interactionData.farmerId,
        email: safeDecryptEmail(interactionData.farmerEmail),
        contactPerson: interactionData.farmerContactPerson,
        companyName: interactionData.farmerCompanyName,
        phoneNumber: interactionData.farmerPhoneNumber,
        address: interactionData.farmerAddress,
        mapLocation: interactionData.farmerMapLocation,
      },
      
      // Buyer Information
      buyer: {
        buyerId: interactionData.buyerId,
        email: safeDecryptEmail(interactionData.buyerEmail),
        fullName: interactionData.buyerFullName,
        companyName: interactionData.buyerCompanyName || '',
        phoneNumber: interactionData.buyerPhoneNumber || '',
      },
      
      // Product Information
      product: {
        productId: interactionData.productId,
        productName: interactionData.productName,
        type: interactionData.productType,
        category: interactionData.productCategory,
        pricePerUnit: interactionData.pricePerUnit,
      },
      
      // Interaction Details (specific to request_sample)
      sampleDetails: interactionData.sampleDetails || null, // { quantity, address, notes }
      
      // Status and Notes
      status: 'pending', // pending, accepted, rejected, completed
      buyerNotes: interactionData.buyerNotes || '',
      farmerResponse: '',
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      respondedAt: null,
    };
    
    console.log('Creating interaction:', interactionRecord.interactionType);
    
    // Insert the interaction into MongoDB
    const result = await db.collection('interactions').insertOne(interactionRecord);
    
    if (result.acknowledged) {
      return NextResponse.json({
        success: true,
        message: `${interactionData.interactionType.replace('_', ' ')} recorded successfully`,
        interactionId: result.insertedId,
        data: interactionRecord
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to record interaction'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error recording interaction:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Retrieve interactions (filtered by user)
export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType'); // 'farmer' or 'buyer'
    const interactionType = searchParams.get('interactionType'); // optional filter
    const status = searchParams.get('status'); // optional filter
    
    if (!userId || !userType) {
      return NextResponse.json({
        success: false,
        message: 'Missing required query parameters: userId, userType'
      }, { status: 400 });
    }
    
    // Build query based on user type
    let query: any = {};
    
    if (userType === 'farmer') {
      query.farmerid = userId;
    } else if (userType === 'buyer') {
      query.buyerid = userId;
    } else {
      return NextResponse.json({
        success: false,
        message: 'Invalid userType. Must be "farmer" or "buyer"'
      }, { status: 400 });
    }
    
    // Add optional filters
    if (interactionType) {
      query.interactionType = interactionType;
    }
    
    if (status) {
      query.status = status;
    }
    
    console.log('Fetching interactions with query:', query);
    
    // Fetch interactions from database
    const interactions = await db.collection('interactions')
      .find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .toArray();
    
    return NextResponse.json({
      success: true,
      data: interactions,
      count: interactions.length
    });
    
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch interactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update interaction status (for farmer responses and acceptance workflow)
export async function PUT(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const { 
      interactionId, 
      status, 
      farmerResponse, 
      farmerAccepted, 
      buyerAccepted,
      generateContract,
      signContract,
      signatureType,
      signatureName
    } = await req.json();
    
    if (!interactionId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required field: interactionId'
      }, { status: 400 });
    }
    
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (status !== undefined) {
      updateData.status = status;
      updateData.respondedAt = new Date();
    }
    
    if (farmerResponse !== undefined) {
      updateData.farmerResponse = farmerResponse;
    }
    
    // Handle acceptance fields
    if (farmerAccepted !== undefined) {
      updateData.farmerAccepted = farmerAccepted;
    }
    
    if (buyerAccepted !== undefined) {
      updateData.buyerAccepted = buyerAccepted;
    }

    // Check if both parties have now accepted and send email notification
    const { ObjectId: ObjIdCheck } = require('mongodb');
    const currentInteraction = await db.collection('interactions').findOne({
      _id: new ObjIdCheck(interactionId)
    });

    if (currentInteraction) {
      const bothAcceptedNow = (
        (farmerAccepted === true || currentInteraction.farmerAccepted === true) &&
        (buyerAccepted === true || currentInteraction.buyerAccepted === true)
      );

      const wasNotBothAcceptedBefore = !(
        currentInteraction.farmerAccepted === true && 
        currentInteraction.buyerAccepted === true
      );

      // Send acceptance email only if this update causes both to be accepted
      if (bothAcceptedNow && wasNotBothAcceptedBefore) {
        try {
          await sendInteractionAcceptanceEmail(
            currentInteraction.farmer?.email || '',
            currentInteraction.buyer?.email || '',
            currentInteraction.farmer?.contactPerson || 'Farmer',
            currentInteraction.buyer?.fullName || 'Buyer',
            currentInteraction.product?.productName || 'Product',
            currentInteraction.interactionType || 'interaction'
          );
          console.log('Sent acceptance notification emails to both parties');
        } catch (emailError) {
          // Log but don't fail the transaction
          console.error('Failed to send acceptance emails:', emailError);
        }
      }
    }

    // Handle contract generation
    if (generateContract && status === 'contract') {
      updateData.contract = {
        generatedAt: new Date().toISOString(),
      };
    }

    // Handle contract signing
    if (signContract && signatureName) {
      const { ObjectId } = require('mongodb');
      const interaction = await db.collection('interactions').findOne({
        _id: new ObjectId(interactionId)
      });

      if (!interaction) {
        return NextResponse.json({
          success: false,
          message: 'Interaction not found'
        }, { status: 404 });
      }

      // Update signature based on type
      const contract = interaction.contract || {};
      
      if (signatureType === 'farmer') {
        contract.farmerSignature = signatureName;
        contract.farmerSignedAt = new Date().toISOString();
      } else if (signatureType === 'buyer') {
        contract.buyerSignature = signatureName;
        contract.buyerSignedAt = new Date().toISOString();
      }

      updateData.contract = contract;

      // Check if both have signed - if yes, move to payment status
      const bothSigned = contract.farmerSignature && contract.buyerSignature;
      console.log('Contract signing status:', {
        farmerSignature: contract.farmerSignature,
        buyerSignature: contract.buyerSignature,
        bothSigned: bothSigned
      });

      if (bothSigned) {
        updateData.status = 'payment';

        // Generate PDF and send contract signed email notification
        try {
          console.log('Both parties signed - generating PDF and sending emails...');
          
          // Create updated interaction object with complete contract data
          const interactionWithSignatures = {
            ...interaction,
            contract: contract
          };

          // Generate contract PDF
          console.log('Generating contract PDF...');
          const contractPdf = await generateContractPDF(interactionWithSignatures as any);
          console.log('PDF generated successfully, size:', contractPdf.length, 'bytes');
          
          // Send email with PDF attachment
          console.log('Sending emails to:', {
            farmer: interaction.farmer?.email,
            buyer: interaction.buyer?.email
          });
          
          await sendContractSignedEmail(
            interaction.farmer?.email || '',
            interaction.buyer?.email || '',
            interaction.farmer?.contactPerson || 'Farmer',
            interaction.buyer?.fullName || 'Buyer',
            interaction.product?.productName || 'Product',
            contractPdf
          );
          console.log('✅ Sent contract signed notification emails with PDF attachment to both parties');
        } catch (emailError) {
          // Log but don't fail the transaction
          console.error('❌ Failed to send contract signed emails:', emailError);
          console.error('Email error details:', emailError instanceof Error ? emailError.message : 'Unknown error');
        }
      }

      const { ObjectId: ObjId } = require('mongodb');
      const result = await db.collection('interactions').updateOne(
        { _id: new ObjId(interactionId) },
        { $set: updateData }
      );

      if (result.modifiedCount > 0) {
        return NextResponse.json({
          success: true,
          message: bothSigned 
            ? 'Contract signed successfully! Both parties have signed. Status updated to payment.' 
            : 'Contract signed successfully!',
          bothSigned: bothSigned
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to update contract signature'
        }, { status: 500 });
      }
    }
    
    const { ObjectId } = require('mongodb');
    const result = await db.collection('interactions').updateOne(
      { _id: new ObjectId(interactionId) },
      { $set: updateData }
    );
    
    if (result.modifiedCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Interaction updated successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Interaction not found or no changes made'
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Error updating interaction:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Remove an interaction
export async function DELETE(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const { interactionId } = await req.json();
    
    if (!interactionId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required field: interactionId'
      }, { status: 400 });
    }
    
    const { ObjectId } = require('mongodb');
    const result = await db.collection('interactions').deleteOne({
      _id: new ObjectId(interactionId)
    });
    
    if (result.deletedCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Interaction deleted successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Interaction not found'
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Error deleting interaction:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
