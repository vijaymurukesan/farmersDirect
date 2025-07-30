import clientPromise from '@/app/db/mongodb';

export async function GET(req: Request) {
    const client = await clientPromise;
    const db = client.db(); // Uses the DB from your URI
    const products = await db.collection('products').find({}).toArray();
    return Response.json(products);
}
