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
