import clientPromise from '@/app/db/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(req: Request) {
    const client = await clientPromise;
    const db = client.db(); // Uses the DB from your URI
    const products = await db.collection('products').find({}).toArray();
    return Response.json(products);
}

export async function POST(req: Request) {
    try {
        // Verify authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            console.error('JWT verification error:', error);
            return Response.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await req.json();
        const { title, type, description, price, images, videos, adminNotes } = body;

        // Validation
        if (!title || !type || !description) {
            return Response.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // Get the highest productId to generate the next one
        const lastProduct = await db
            .collection('products')
            .find({})
            .sort({ productId: -1 })
            .limit(1)
            .toArray();

        let nextProductId = '1';
        if (lastProduct.length > 0 && lastProduct[0].productId) {
            const currentId = parseInt(lastProduct[0].productId);
            nextProductId = (currentId + 1).toString();
        }

        // Create product document
        const productData = {
            title,
            type,
            images: images || [],
            videos: videos || [],
            description,
            price: price ? parseFloat(price) : 0,
            adminNotes: adminNotes || '',
            productId: nextProductId,
            verificationStatus: 'pending',
            submittedBy: {
                userId: decoded.userId,
                email: decoded.email,
                userType: decoded.userType,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Insert into database
        const result = await db.collection('products').insertOne(productData);

        return Response.json(
            {
                success: true,
                message: 'Product added successfully',
                data: {
                    ...productData,
                    _id: result.insertedId,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error adding product:', error);
        return Response.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to add product',
            },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { productId, title, type, price, description } = body;

        if (!productId) {
            return Response.json(
                { success: false, message: 'Product ID is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();
        
        // Build update object with only provided fields
        const updateData: any = {
            updatedAt: new Date(),
        };
        
        if (title !== undefined) updateData.title = title;
        if (type !== undefined) updateData.type = type;
        if (price !== undefined) updateData.price = price;
        if (description !== undefined) updateData.description = description;
        
        // Update the product in products collection
        const result = await db.collection('products').updateOne(
            { productId },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return Response.json({ 
                success: false, 
                message: 'Product not found' 
            }, { status: 404 });
        }
        
        // Also update in productDetails collection if it exists there
        await db.collection('productDetails').updateOne(
            { productId },
            { $set: updateData }
        );
        
        return Response.json({ 
            success: true, 
            message: 'Product updated successfully',
            productId 
        });
    } catch (error) {
        console.error('Error updating product:', error);
        return Response.json({ 
            success: false, 
            message: 'Failed to update product' 
        }, { status: 500 });
    }
}
