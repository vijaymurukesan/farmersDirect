import { NextRequest, NextResponse } from 'next/server';
import { generateContractPDF } from '@/app/lib/contractPdfGenerator';
import clientPromise from '@/app/db/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interactionId } = body;

    // Validate required fields
    if (!interactionId) {
      return NextResponse.json(
        { success: false, message: 'Missing interaction ID' },
        { status: 400 }
      );
    }

    // Get interaction from database
    const { ObjectId } = require('mongodb');
    const client = await clientPromise;
    const db = client.db();
    
    const interaction: any = await db.collection('interactions').findOne({
      _id: new ObjectId(interactionId)
    });

    if (!interaction) {
      return NextResponse.json(
        { success: false, message: 'Interaction not found' },
        { status: 404 }
      );
    }

    if (!interaction.contract) {
      return NextResponse.json(
        { success: false, message: 'Contract not found for this interaction' },
        { status: 404 }
      );
    }

    // Generate PDF buffer
    console.log('Generating PDF for interaction:', {
      _id: interaction._id,
      hasContract: !!interaction.contract,
      hasFarmer: !!interaction.farmer,
      hasBuyer: !!interaction.buyer,
      hasProduct: !!interaction.product,
      farmer: interaction.farmer ? {
        contactPerson: interaction.farmer.contactPerson,
        companyName: interaction.farmer.companyName,
        hasAddress: !!interaction.farmer.address,
        hasEmail: !!interaction.farmer.email,
        hasPhone: !!interaction.farmer.phoneNumber,
      } : null,
      buyer: interaction.buyer ? {
        fullName: interaction.buyer.fullName,
        hasEmail: !!interaction.buyer.email,
      } : null,
      product: interaction.product ? {
        productName: interaction.product.productName,
      } : null,
    });
    
    const pdfBuffer = await generateContractPDF(interaction);

    console.log('PDF generated successfully, buffer size:', pdfBuffer.length);
    
    // Convert Buffer to Uint8Array for NextResponse
    const pdfArray = new Uint8Array(pdfBuffer);

    // Extract buyer and farmer IDs for filename
    const buyerId = interaction.buyerid || interaction.buyerId || 'BUYER';
    const farmerId = interaction.farmerid || interaction.farmerId || 'FARMER';
    const filename = `Farmers_Direct_${buyerId}_${farmerId}_${interactionId}.pdf`;

    // Return PDF as blob
    return new NextResponse(pdfArray, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating contract PDF:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate contract PDF', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
