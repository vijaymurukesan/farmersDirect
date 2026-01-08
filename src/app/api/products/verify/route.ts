import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/db/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key-change-in-production';

export async function PATCH(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; userType: string };
    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin or owner
    if (decoded.userType !== 'admin' && decoded.userType !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin/Owner access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { productId, action, updatedData, rejectionReason } = body;

    if (!productId || !action) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get database connection
    const client = await clientPromise;
    const db = client.db();
    const productsCollection = db.collection('products');

    if (action === 'approve') {
      // Build update object
      const updateFields: any = {
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: decoded.email,
        updatedAt: new Date(),
      };

      // If there's updated data, merge it
      if (updatedData) {
        updateFields.title = updatedData.title;
        updateFields.type = updatedData.type;
        updateFields.description = updatedData.description;
        updateFields.price = updatedData.price;
        if (updatedData.adminNotes !== undefined) {
          updateFields.adminNotes = updatedData.adminNotes;
        }
      }

      // Update the product with all changes at once
      const result = await productsCollection.updateOne(
        { _id: new ObjectId(productId) },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Product approved successfully',
      });
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { success: false, message: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      // First, get the product details to send email
      const product = await productsCollection.findOne({
        _id: new ObjectId(productId),
      });

      if (!product) {
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }

      // Send rejection email if product has submitter info
      if (product.submittedBy && product.submittedBy.email) {
        try {
          const emailResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-product-rejection-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: product.submittedBy.email,
                productTitle: product.title,
                rejectionReason: rejectionReason,
                userType: product.submittedBy.userType || 'user',
              }),
            }
          );

          if (!emailResponse.ok) {
            console.error('Failed to send rejection email, but continuing with deletion');
          }
        } catch (emailError) {
          console.error('Error sending rejection email:', emailError);
          // Continue with deletion even if email fails
        }
      }

      // Delete the product from database
      const result = await productsCollection.deleteOne({
        _id: new ObjectId(productId),
      });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Product rejected and removed successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify product' },
      { status: 500 }
    );
  }
}
