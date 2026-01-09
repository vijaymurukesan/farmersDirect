import clientPromise from '@/app/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { decryptEmail } from '@/app/lib/encryption';
import { sendInteractionAcceptanceEmail, sendDeliveryNotificationEmail, sendBalancePaymentApprovedEmail } from '@/app/lib/emailService';

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
    const paymentStatus = searchParams.get('paymentStatus'); // optional filter for payment verification
    const adminView = searchParams.get('adminView'); // 'true' for admin payment verification view
    
    // If adminView is true, fetch all interactions with pending payments
    if (adminView === 'true' && paymentStatus === 'pending') {
      // Query for interactions with either pending advance payment OR pending balance payment
      // Note: For advance payments, status must be 'payment'
      // For balance payments, status can be 'awaiting-delivery' or other statuses
      const interactions = await db.collection('interactions')
        .find({ 
          $or: [
            { 
              'payment.verificationStatus': 'pending',
              status: 'payment'
            },
            { 'paymentBalance.verificationStatus': 'pending' }
          ]
        })
        .sort({ 
          'payment.submittedAt': -1,
          'paymentBalance.submittedAt': -1
        })
        .toArray();
      
      console.log('📋 Admin View: Found', interactions.length, 'interactions with pending payments');
      
      // Fetch buyer and farmer details for each interaction
      const enrichedInteractions = await Promise.all(
        interactions.map(async (interaction) => {
          const buyerDetails = await db.collection('users').findOne({ 
            $or: [{ buyerId: interaction.buyerid }, { _id: interaction.buyerid }]
          });
          const farmerDetails = await db.collection('farmers').findOne({ 
            farmerId: interaction.farmerid 
          });
          
          // Determine payment type for logging
          const hasAdvancePending = interaction.payment?.verificationStatus === 'pending';
          const hasBalancePending = interaction.paymentBalance?.verificationStatus === 'pending';
          console.log(`  📌 Interaction ${interaction._id}: Advance=${hasAdvancePending}, Balance=${hasBalancePending}`);
          
          return {
            ...interaction,
            buyer: buyerDetails,
            farmer: farmerDetails
          };
        })
      );
      
      return NextResponse.json({
        success: true,
        data: enrichedInteractions,
        count: enrichedInteractions.length
      });
    }
    
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
      buyerResponse, 
      farmerAccepted, 
      buyerAccepted,
      generateContract,
      signContract,
      signatureType,
      signatureName,
      paymentScreenshot,
      approvePayment,
      rejectPayment,
      rejectionReason,
      notifyDeliveryReady,
      submitBalancePayment,
      balancePaymentScreenshot,
      approveBalancePayment,
      rejectBalancePayment,
      markGoodsDelivered,
      confirmDeliveryAndRelease
    } = await req.json();
    
    console.log('PUT /api/interactions received:', {
      interactionId,
      submitBalancePayment,
      balancePaymentScreenshot,
      approveBalancePayment,
      rejectBalancePayment
    });
    
    if (!interactionId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required field: interactionId'
      }, { status: 400 });
    }
    
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    
    if (status !== undefined) {
      updateData.status = status;
      updateData.respondedAt = new Date();
    }
    
    if (farmerResponse !== undefined) {
      updateData.farmerResponse = farmerResponse;
    }
    
    if (buyerResponse !== undefined) {
      updateData.buyerResponse = buyerResponse;
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

    // Handle payment screenshot submission
    if (paymentScreenshot) {
      const { ObjectId: PaymentObjId } = require('mongodb');
      const interaction = await db.collection('interactions').findOne({
        _id: new PaymentObjId(interactionId)
      });

      if (!interaction) {
        return NextResponse.json({
          success: false,
          message: 'Interaction not found'
        }, { status: 404 });
      }

      // Calculate payment amounts
      const totalAmount = interaction.product?.pricePerUnit || 0;
      const advanceAmount = totalAmount * 0.1;

      updateData.payment = {
        transactionId: `TXN${interactionId.substring(interactionId.length - 12).toUpperCase()}`,
        totalAmount: totalAmount,
        advanceAmount: advanceAmount,
        screenshotUrl: paymentScreenshot,
        submittedAt: new Date().toISOString(),
        verificationStatus: 'pending'
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
        console.log('Both parties signed - contract complete. Status updated to payment.');
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

    // Handle payment approval (admin only)
    if (approvePayment) {
      const { ObjectId: ApproveObjId } = require('mongodb');
      const interaction = await db.collection('interactions').findOne({
        _id: new ApproveObjId(interactionId)
      });

      if (!interaction || !interaction.payment) {
        return NextResponse.json({
          success: false,
          message: 'Payment not found'
        }, { status: 404 });
      }

      updateData.payment = {
        ...interaction.payment,
        verificationStatus: 'verified',
        verifiedAt: new Date().toISOString()
      };

      // Update status to awaiting-delivery when payment is verified
      updateData.status = 'awaiting-delivery';

      // Generate and send contract PDF to both parties
      try {
        const { generateContractPDF } = await import('@/app/lib/contractPdfGenerator');
        const { sendContractPdfEmail } = await import('@/app/lib/emailService');
        
        // Type assertion for the interaction object
        const contractPdfBuffer = await generateContractPDF(interaction as any);
        
        // Prepare transaction details for email
        const transactionDetails = interaction.payment ? {
          transactionId: interaction.payment.transactionId || 'N/A',
          totalAmount: interaction.payment.totalAmount || 0,
          advanceAmount: interaction.payment.advanceAmount || 0,
          paymentDate: interaction.payment.submittedAt || new Date().toISOString()
        } : undefined;
        
        await sendContractPdfEmail(
          interaction.farmer?.email || '',
          interaction.buyer?.email || '',
          interaction.farmer?.contactPerson || 'Farmer',
          interaction.buyer?.fullName || 'Buyer',
          interaction.product?.productName || 'Product',
          contractPdfBuffer,
          transactionDetails
        );
        
        console.log('✅ Contract PDF generated and emailed to both parties successfully');
        console.log(`   - Farmer: ${interaction.farmer?.email}`);
        console.log(`   - Buyer: ${interaction.buyer?.email}`);
        if (transactionDetails) {
          console.log(`   - Transaction ID: ${transactionDetails.transactionId}`);
          console.log(`   - Total Amount: ₹${transactionDetails.totalAmount}`);
          console.log(`   - Advance (10%): ₹${transactionDetails.advanceAmount}`);
        }
      } catch (emailError) {
        // Log but don't fail the payment approval
        console.error('⚠️ Failed to send contract PDF emails:', emailError);
        console.error('   Payment approval will still proceed, but emails were not sent');
      }

      console.log('Payment approved for interaction:', interactionId, '- Status updated to awaiting-delivery');
    }

    // Handle payment rejection (admin only)
    if (rejectPayment && rejectionReason) {
      const { ObjectId: RejectObjId } = require('mongodb');
      const interaction = await db.collection('interactions').findOne({
        _id: new RejectObjId(interactionId)
      });

      if (!interaction || !interaction.payment) {
        return NextResponse.json({
          success: false,
          message: 'Payment not found'
        }, { status: 404 });
      }

      updateData.payment = {
        ...interaction.payment,
        verificationStatus: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectionReason,
        screenshotUrl: null // Clear screenshot to allow retry
      };

      // TODO: Send rejection email to both buyer and farmer
      console.log('Payment rejected for interaction:', interactionId, 'Reason:', rejectionReason);
    }

    // Handle balance payment approval (admin only)
    if (approveBalancePayment) {
      const { ObjectId: ApproveBalanceObjId } = require('mongodb');
      const interaction = await db.collection('interactions').findOne({
        _id: new ApproveBalanceObjId(interactionId)
      });

      if (!interaction || !interaction.paymentBalance) {
        return NextResponse.json({
          success: false,
          message: 'Balance payment not found'
        }, { status: 404 });
      }

      updateData.paymentBalance = {
        ...interaction.paymentBalance,
        verificationStatus: 'verified',
        verifiedAt: new Date().toISOString()
      };

      // Keep status as awaiting-delivery (farmer will mark as delivered next)
      // Status will change to 'confirming-delivery' when farmer marks goods delivered
      // and finally to 'completed' when buyer confirms delivery and releases payment

      // Send email notification to farmer about balance payment approval
      try {
        const farmerEmail = safeDecryptEmail(interaction.farmer?.email || '');
        const buyerName = interaction.buyer?.fullName || 'Buyer';
        const farmerName = interaction.farmer?.contactPerson || 'Farmer';
        const productName = interaction.product?.productName || 'Product';
        const balanceAmount = interaction.paymentBalance?.balanceAmount || 0;
        const transactionId = interaction.paymentBalance?.transactionId || 'N/A';

        await sendBalancePaymentApprovedEmail(
          farmerEmail,
          buyerName,
          farmerName,
          productName,
          balanceAmount,
          transactionId
        );
        console.log('✅ Balance payment approval notification email sent to farmer');
        console.log(`   - Farmer: ${farmerEmail}`);
        console.log(`   - Balance Amount: ₹${balanceAmount}`);
        console.log(`   - Transaction ID: ${transactionId}`);
      } catch (emailError) {
        // Log but don't fail the payment approval
        console.error('⚠️ Failed to send balance payment approval email:', emailError);
        console.error('   Payment approval will still proceed, but email was not sent');
      }

      console.log('Balance payment approved for interaction:', interactionId, '- Awaiting delivery notification from farmer');
    }

    // Handle balance payment rejection (admin only)
    if (rejectBalancePayment && rejectionReason) {
      const { ObjectId: RejectBalanceObjId } = require('mongodb');
      const interaction = await db.collection('interactions').findOne({
        _id: new RejectBalanceObjId(interactionId)
      });

      if (!interaction || !interaction.paymentBalance) {
        return NextResponse.json({
          success: false,
          message: 'Balance payment not found'
        }, { status: 404 });
      }

      updateData.paymentBalance = {
        ...interaction.paymentBalance,
        verificationStatus: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectionReason,
        screenshotUrl: null // Clear screenshot to allow retry
      };

      // TODO: Send rejection email to both buyer and farmer
      console.log('Balance payment rejected for interaction:', interactionId, 'Reason:', rejectionReason);
    }

    // Handle delivery notification (farmer notifies buyer that product is ready)
    if (notifyDeliveryReady) {
      const { ObjectId: DeliveryObjId } = require('mongodb');
      const interaction = await db.collection('interactions').findOne({
        _id: new DeliveryObjId(interactionId)
      });

      if (!interaction) {
        return NextResponse.json({
          success: false,
          message: 'Interaction not found'
        }, { status: 404 });
      }

      // Verify that payment has been verified
      if (interaction.payment?.verificationStatus !== 'verified') {
        return NextResponse.json({
          success: false,
          message: 'Payment must be verified before notifying delivery'
        }, { status: 400 });
      }

      updateData.deliveryNotified = true;
      updateData.deliveryNotifiedAt = new Date().toISOString();

      // Send email notification to buyer about delivery readiness
      try {
        const totalAmount = interaction.payment?.totalAmount || 0;
        const advanceAmount = interaction.payment?.advanceAmount || 0;
        const balanceAmount = totalAmount - advanceAmount;
        const transactionReference = `TXN${interactionId.substring(interactionId.length - 12).toUpperCase()}`;

        await sendDeliveryNotificationEmail(
          interaction.buyer?.email || '',
          interaction.farmer?.contactPerson || 'Farmer',
          interaction.buyer?.fullName || 'Buyer',
          interaction.product?.productName || 'Product',
          balanceAmount,
          transactionReference
        );
        console.log('✅ Delivery notification email sent to buyer:', interaction.buyer?.email);
      } catch (emailError) {
        console.error('⚠️ Failed to send delivery notification email:', emailError);
        // Don't fail the notification, just log the error
      }

      console.log('Delivery notification sent for interaction:', interactionId);
      console.log('Buyer will now be prompted to complete 90% balance payment');
    }

    // Handle balance payment submission (buyer uploads 90% payment screenshot) - DIRECT DB APPROACH
    if (submitBalancePayment && balancePaymentScreenshot) {
      try {
        console.log('');
        console.log('==================== BALANCE PAYMENT SUBMISSION ====================');
        console.log('🔄 Starting balance payment submission');
        console.log('📋 Interaction ID:', interactionId);
        console.log('📋 Interaction ID type:', typeof interactionId);
        console.log('📋 Interaction ID length:', interactionId?.length);
        console.log('📸 Screenshot URL:', balancePaymentScreenshot);
        
        const { ObjectId: BalanceObjId } = require('mongodb');
        
        // Validate interaction ID format
        if (!interactionId || interactionId.length !== 24) {
          console.error('❌ Invalid interaction ID format:', interactionId);
          return NextResponse.json({
            success: false,
            message: 'Invalid interaction ID format'
          }, { status: 400 });
        }
        
        console.log('🔍 Searching for interaction in database...');
        const interaction = await db.collection('interactions').findOne({
          _id: new BalanceObjId(interactionId)
        });

        if (!interaction) {
          console.error('❌ Interaction not found in database');
          console.error('   Interaction ID searched:', interactionId);
          return NextResponse.json({
            success: false,
            message: 'Interaction not found'
          }, { status: 404 });
        }

        console.log('✅ Interaction found!');
        console.log('   _id:', interaction._id);
        console.log('   status:', interaction.status);
        console.log('   deliveryNotified:', interaction.deliveryNotified);

        // Verify that delivery has been notified
        if (!interaction.deliveryNotified) {
          console.error('❌ Delivery not notified yet - cannot submit balance payment');
          return NextResponse.json({
            success: false,
            message: 'Delivery must be notified before submitting balance payment'
          }, { status: 400 });
        }

        console.log('✅ Delivery notification verified');

        // Calculate balance amount (90% of total)
        const totalAmount = interaction.payment?.totalAmount || 0;
        const advanceAmount = interaction.payment?.advanceAmount || 0;
        const balanceAmount = totalAmount - advanceAmount;

        console.log('💰 Payment Calculation:');
        console.log('   Total Amount:', totalAmount);
        console.log('   Advance Paid (10%):', advanceAmount);
        console.log('   Balance Due (90%):', balanceAmount);

        // Create the balance payment object
        const balancePaymentData = {
          transactionId: `BAL${interactionId.substring(interactionId.length - 12).toUpperCase()}`,
          totalAmount: totalAmount,
          balanceAmount: balanceAmount,
          screenshotUrl: balancePaymentScreenshot,
          submittedAt: new Date().toISOString(),
          verificationStatus: 'pending'
        };

        console.log('📝 Balance Payment Data to Save:');
        console.log(JSON.stringify(balancePaymentData, null, 2));

        // DIRECT DATABASE UPDATE
        console.log('💾 Executing database update...');
        const updateResult = await db.collection('interactions').updateOne(
          { _id: new BalanceObjId(interactionId) },
          { 
            $set: { 
              paymentBalance: balancePaymentData,
              updatedAt: new Date().toISOString()
            } 
          }
        );

        console.log('💾 Database Update Result:');
        console.log('   Matched Count:', updateResult.matchedCount);
        console.log('   Modified Count:', updateResult.modifiedCount);
        console.log('   Acknowledged:', updateResult.acknowledged);

        if (updateResult.matchedCount === 0) {
          console.error('❌ No interaction matched the query!');
          return NextResponse.json({
            success: false,
            message: 'Interaction not found for update'
          }, { status: 404 });
        }

        if (updateResult.modifiedCount === 0) {
          console.warn('⚠️  Document matched but not modified (data might be identical)');
        }

        // Verify the update by fetching the document again
        console.log('🔍 Verifying update by re-fetching document...');
        const verifyDoc = await db.collection('interactions').findOne({
          _id: new BalanceObjId(interactionId)
        });
        
        if (verifyDoc?.paymentBalance) {
          console.log('✅✅✅ SUCCESS! Balance payment saved to database!');
          console.log('   Transaction ID:', verifyDoc.paymentBalance.transactionId);
          console.log('   Balance Amount:', verifyDoc.paymentBalance.balanceAmount);
          console.log('   Verification Status:', verifyDoc.paymentBalance.verificationStatus);
        } else {
          console.error('❌❌❌ FAILED! paymentBalance field not found in document after update!');
          console.log('Document after update:', JSON.stringify(verifyDoc, null, 2));
        }

        console.log('==================================================================');
        console.log('');

        return NextResponse.json({
          success: true,
          message: 'Payment submitted for Admin verification',
          data: {
            transactionId: balancePaymentData.transactionId,
            balanceAmount: balancePaymentData.balanceAmount
          }
        });
        
      } catch (error) {
        console.error('❌❌❌ ERROR in balance payment submission:', error);
        console.error('Error details:', error instanceof Error ? error.message : error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json({
          success: false,
          message: 'Error saving balance payment: ' + (error instanceof Error ? error.message : 'Unknown error')
        }, { status: 500 });
      }
    }

    // Handle farmer marking goods as delivered (after balance payment is verified)
    if (markGoodsDelivered) {
      const { ObjectId: DeliveredObjId } = require('mongodb');
      const interaction = await db.collection('interactions').findOne({
        _id: new DeliveredObjId(interactionId)
      });

      if (!interaction) {
        return NextResponse.json({
          success: false,
          message: 'Interaction not found'
        }, { status: 404 });
      }

      // Verify that balance payment has been verified
      if (interaction.paymentBalance?.verificationStatus !== 'verified') {
        return NextResponse.json({
          success: false,
          message: 'Balance payment must be verified before marking goods as delivered'
        }, { status: 400 });
      }

      updateData.goodsDelivered = true;
      updateData.goodsDeliveredAt = new Date().toISOString();
      updateData.status = 'confirming-delivery';

      // Send email notification to buyer about goods delivery
      try {
        const { sendGoodsDeliveredEmail } = await import('@/app/lib/emailService');
        
        await sendGoodsDeliveredEmail(
          interaction.buyer?.email || '',
          interaction.farmer?.contactPerson || 'Farmer',
          interaction.buyer?.fullName || 'Buyer',
          interaction.product?.productName || 'Product',
          interaction.paymentBalance?.balanceAmount || 0,
          interaction.paymentBalance?.transactionId || 'N/A'
        );
        console.log('✅ Goods delivered notification email sent to buyer:', interaction.buyer?.email);
      } catch (emailError) {
        console.error('⚠️ Failed to send goods delivered notification email:', emailError);
        // Don't fail the operation, just log the error
      }

      console.log('Goods marked as delivered for interaction:', interactionId);
      console.log('Buyer will now be prompted to confirm receipt and release payment');
    }

    // Handle buyer confirming delivery and releasing payment
    if (confirmDeliveryAndRelease) {
      const { ObjectId: ConfirmObjId } = require('mongodb');
      const interaction = await db.collection('interactions').findOne({
        _id: new ConfirmObjId(interactionId)
      });

      if (!interaction) {
        return NextResponse.json({
          success: false,
          message: 'Interaction not found'
        }, { status: 404 });
      }

      // Verify that goods were marked as delivered by farmer
      if (!interaction.goodsDelivered) {
        return NextResponse.json({
          success: false,
          message: 'Goods must be marked as delivered by farmer first'
        }, { status: 400 });
      }

      updateData.deliveryConfirmed = true;
      updateData.deliveryConfirmedAt = new Date().toISOString();
      updateData.paymentReleased = true;
      updateData.paymentReleasedAt = new Date().toISOString();
      updateData.status = 'completed';

      // Send email notification to farmer about payment release
      try {
        const { sendPaymentReleasedEmail } = await import('@/app/lib/emailService');
        
        await sendPaymentReleasedEmail(
          interaction.farmer?.email || '',
          interaction.buyer?.fullName || 'Buyer',
          interaction.farmer?.contactPerson || 'Farmer',
          interaction.product?.productName || 'Product',
          interaction.paymentBalance?.balanceAmount || 0,
          interaction.paymentBalance?.transactionId || 'N/A'
        );
        console.log('✅ Payment released notification email sent to farmer:', interaction.farmer?.email);
      } catch (emailError) {
        console.error('⚠️ Failed to send payment released notification email:', emailError);
        // Don't fail the operation, just log the error
      }

      console.log('Delivery confirmed and payment released for interaction:', interactionId);
      console.log('Interaction status updated to completed');
    }
    
    const { ObjectId } = require('mongodb');
    console.log('About to update database with updateData:', JSON.stringify(updateData, null, 2));
    
    const result = await db.collection('interactions').updateOne(
      { _id: new ObjectId(interactionId) },
      { $set: updateData }
    );
    
    console.log('Database update result:', { 
      matchedCount: result.matchedCount, 
      modifiedCount: result.modifiedCount,
      acknowledged: result.acknowledged
    });
    
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
