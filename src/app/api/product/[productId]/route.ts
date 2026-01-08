import clientPromise from '@/app/db/mongodb';

export async function GET(req: Request, { params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params;
    const client = await clientPromise;
    const db = client.db(); // Uses the DB from your URI
    const product = await db.collection('productDetails').findOne({ productId });
    if (!product) {
        return Response.json({ error: 'Product not found' }, { status: 404 });
    }
    return Response.json(product);
}

export async function PUT(req: Request, { params }: { params: Promise<{ productId: string }> }) {
    try {
        const { productId } = await params;
        const body = await req.json();
        
        const client = await clientPromise;
        const db = client.db();
        
        // Build update object with only provided fields
        const updateData: any = {
            updatedAt: new Date(),
        };
        
        if (body.title !== undefined) updateData.title = body.title;
        if (body.type !== undefined) updateData.type = body.type;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.price !== undefined) updateData.price = body.price;
        if (body.description !== undefined) updateData.description = body.description;
        
        // Update the product in productDetails collection
        const result = await db.collection('productDetails').updateOne(
            { productId },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return Response.json({ 
                success: false, 
                message: 'Product not found' 
            }, { status: 404 });
        }
        
        // Also update in products collection if it exists there
        await db.collection('products').updateOne(
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
