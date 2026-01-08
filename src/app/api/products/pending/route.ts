import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/db/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
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

    // Check if user is admin
    if (decoded.userType !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get pending products from database
    const client = await clientPromise;
    const db = client.db();
    const productsCollection = db.collection('products');

    const pendingProducts = await productsCollection
      .find({ verificationStatus: 'pending' })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      products: pendingProducts,
    });
  } catch (error) {
    console.error('Error fetching pending products:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pending products' },
      { status: 500 }
    );
  }
}
