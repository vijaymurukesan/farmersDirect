import clientPromise from '@/app/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { hashEmailForSearch } from '@/app/lib/encryption';

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(); // Uses the DB from your URI
    
    // Parse the request body
    const farmerData = await req.json();
    
    // Get farmerId from the user collection based on email
    const emailHash = hashEmailForSearch(farmerData.email);
    const user = await db.collection('users').findOne({ 
      emailHash: emailHash
    });
    
    console.log('Looking up user with email hash:', emailHash);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found. Please register as a user first.'
      }, { status: 404 });
    }
    
    if (user.userType !== 'farmer') {
      return NextResponse.json({
        success: false,
        message: 'Only users with farmer type can register as farmers'
      }, { status: 403 });
    }
    
    const farmerId = user.farmerId;
    
    if (!farmerId) {
      return NextResponse.json({
        success: false,
        message: 'Farmer ID not found in user record'
      }, { status: 400 });
    }
    
    // Add timestamp, farmerId, and ensure email is included
    const farmerRecord = {
      ...farmerData,
      farmerId: farmerId, // Use farmerId from user collection
      email: farmerData.email, // Explicitly ensure email is present
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Creating farmer with ID:', farmerId, 'Email:', farmerData.email);
    
    // Insert the farmer registration into MongoDB
    const result = await db.collection('farmers').insertOne(farmerRecord);
    
    if (result.acknowledged) {
      return NextResponse.json({
        success: true,
        message: 'Farmer registered successfully',
        farmerId: farmerId,
        mongoId: result.insertedId,
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

export async function PUT(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Parse the request body
    const { email, productId, ...farmerData } = await req.json();
    
    console.log('PUT request received:', { email, productId });
    
    if (!email || !productId) {
      return NextResponse.json({
        success: false,
        message: 'Email and productId are required for update'
      }, { status: 400 });
    }
    
    // Update farmer in productDetails collection
    const updateData = {
      ...farmerData,
      updatedAt: new Date()
    };
    
    // Step 1: Update in the farmers collection
    const farmerUpdateResult = await db.collection('farmers').updateOne(
      { 
        email,
        'relatedProduct.productId': productId
      },
      { 
        $set: updateData
      }
    );
    
    console.log('Farmers collection update result:', { modifiedCount: farmerUpdateResult.modifiedCount });
    
    // Step 2: Find the product and update the specific farmer by email in productDetails
    const product = await db.collection('productDetails').findOne({ productId });
    
    if (!product) {
      // If farmer was updated in farmers collection but product not found, still return success
      if (farmerUpdateResult.modifiedCount > 0) {
        return NextResponse.json({
          success: true,
          message: 'Farmer updated in farmers collection (product not found in productDetails)',
          data: updateData
        });
      }
      
      return NextResponse.json({
        success: false,
        message: 'Product not found'
      }, { status: 404 });
    }
    
    // Find the farmer index in the farmers array
    const farmerIndex = product.farmers?.findIndex((f: any) => f.email === email);
    
    if (farmerIndex !== -1 && farmerIndex !== undefined) {
      // Update the specific farmer in the array
      const updateField = `farmers.${farmerIndex}`;
      const productUpdateResult = await db.collection('productDetails').updateOne(
        { productId },
        { 
          $set: { 
            [updateField]: updateData 
          } 
        }
      );
      
      console.log('ProductDetails update result:', { modifiedCount: productUpdateResult.modifiedCount });
    } else {
      console.log('Farmer not found in product farmers array');
    }
    
    // Return success if farmer was updated in either collection
    if (farmerUpdateResult.modifiedCount > 0 || farmerIndex !== -1) {
      return NextResponse.json({
        success: true,
        message: 'Farmer updated successfully in all collections',
        data: updateData
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Farmer not found in any collection'
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Error updating farmer:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Parse the request body
    const { email, productId } = await req.json();
    
    console.log('DELETE request received:', { email, productId });
    
    if (!email || !productId) {
      return NextResponse.json({
        success: false,
        message: 'Email and productId are required for deletion'
      }, { status: 400 });
    }
    
    // Step 1: Delete from the farmers collection
    const farmerDeleteResult = await db.collection('farmers').deleteOne({
      email,
      'relatedProduct.productId': productId
    });
    
    console.log('Farmer collection delete result:', { deletedCount: farmerDeleteResult.deletedCount });
    
    // Step 2: Try to find the product in productDetails collection first
    let product = await db.collection('productDetails').findOne({ productId });
    let collectionName = 'productDetails';
    
    // If not found, try the products collection
    if (!product) {
      product = await db.collection('products').findOne({ productId });
      collectionName = 'products';
    }
    
    console.log('Product found in collection:', collectionName, 'Product:', product ? 'exists' : 'not found');
    
    if (!product) {
      // If farmer was deleted from farmers collection but product not found, still return success
      if (farmerDeleteResult.deletedCount > 0) {
        return NextResponse.json({
          success: true,
          message: 'Farmer deleted from farmers collection (product not found in productDetails/products)'
        });
      }
      
      return NextResponse.json({
        success: false,
        message: `Product with ID ${productId} not found in any collection`
      }, { status: 404 });
    }
    
    // Step 3: Remove farmer from product's farmers array
    // Check if product has farmers array
    if (product.farmers && Array.isArray(product.farmers)) {
      console.log('Current farmers count in product:', product.farmers.length);
      
      // Filter out the farmer with matching email
      const updatedFarmers = product.farmers.filter((f: any) => f.email !== email);
      
      console.log('Updated farmers count:', updatedFarmers.length);
      
      // Update the product with the filtered farmers array in the correct collection
      const productUpdateResult = await db.collection(collectionName).updateOne(
        { productId },
        { 
          $set: { 
            farmers: updatedFarmers,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('Product update result:', { modifiedCount: productUpdateResult.modifiedCount });
    }
    
    // Return success if farmer was deleted from either collection
    if (farmerDeleteResult.deletedCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Farmer deleted successfully from all collections'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Farmer not found in any collection'
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Error deleting farmer:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
