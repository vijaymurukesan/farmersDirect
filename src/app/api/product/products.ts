import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../db/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('farmers_direct');
    const products = await db.collection('products').find({}).toArray();

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
}