import clientPromise from '@/app/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(); // Uses the DB from your URI
    
    // Parse the request body
    const farmerData = await req.json();
    
    // Add timestamp for creation
    const farmerRecord = {
      ...farmerData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the farmer registration into MongoDB
    const result = await db.collection('farmers').insertOne(farmerRecord);
    
    if (result.acknowledged) {
      return NextResponse.json({
        success: true,
        message: 'Farmer registered successfully',
        farmerId: result.insertedId,
        data: farmerRecord
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to register farmer'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error registering farmer:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get all farmers from the collection
    const farmers = await db.collection('farmers').find({}).toArray();
    
    return NextResponse.json({
      success: true,
      data: farmers,
      count: farmers.length
    });
    
  } catch (error) {
    console.error('Error fetching farmers:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch farmers',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
