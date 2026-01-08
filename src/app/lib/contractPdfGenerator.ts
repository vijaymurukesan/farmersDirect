import PDFDocument from 'pdfkit';

interface Interaction {
  farmer: {
    contactPerson: string;
    companyName: string;
    address: string;
    email: string;
    phoneNumber: string;
  };
  buyer: {
    fullName: string;
    companyName?: string;
    email: string;
    phoneNumber?: string;
  };
  product: {
    productName: string;
    type: string;
    category: string;
    pricePerUnit: number;
  };
  farmerid: string;
  buyerid: string;
  interactionType: string;
  buyerNotes?: string;
  farmerResponse?: string;
  sampleDetails?: {
    quantity?: string;
    address?: string;
    notes?: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  contract?: {
    farmerSignature?: string;
    farmerSignedAt?: string;
    buyerSignature?: string;
    buyerSignedAt?: string;
  };
}

export const generateContractPDF = async (interaction: Interaction): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const today = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // Title
      doc.fontSize(18).font('Helvetica-Bold').text('AGRICULTURAL PRODUCE SALE AGREEMENT', {
        align: 'center',
      });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`This Agreement is made on ${today}`, {
        align: 'center',
      });
      doc.moveDown(2);

      // BETWEEN
      doc.fontSize(14).font('Helvetica-Bold').text('BETWEEN:');
      doc.moveDown(0.5);

      // Party of the First Part
      doc.fontSize(12).font('Helvetica-Bold').text('PARTY OF THE FIRST PART (SELLER):');
      doc.fontSize(11).font('Helvetica');
      doc.text(`Name: ${interaction.farmer.contactPerson}`);
      doc.text(`Company: ${interaction.farmer.companyName}`);
      doc.text(`Address: ${interaction.farmer.address}`);
      doc.text(`Email: ${interaction.farmer.email}`);
      doc.text(`Phone: ${interaction.farmer.phoneNumber}`);
      doc.text(`Farmer ID: ${interaction.farmerid}`);
      doc.fontSize(10).font('Helvetica-Oblique');
      doc.text('(Hereinafter referred to as "the Seller" which expression shall, unless repugnant to the context or meaning thereof, include its successors and permitted assigns)', {
        width: 500,
      });
      doc.moveDown(1.5);

      // Party of the Second Part
      doc.fontSize(12).font('Helvetica-Bold').text('AND');
      doc.moveDown(0.5);
      doc.text('PARTY OF THE SECOND PART (BUYER):');
      doc.fontSize(11).font('Helvetica');
      doc.text(`Name: ${interaction.buyer.fullName}`);
      doc.text(`Company: ${interaction.buyer.companyName || 'Individual'}`);
      doc.text(`Email: ${interaction.buyer.email}`);
      doc.text(`Phone: ${interaction.buyer.phoneNumber || 'N/A'}`);
      doc.text(`Buyer ID: ${interaction.buyerid}`);
      doc.fontSize(10).font('Helvetica-Oblique');
      doc.text('(Hereinafter referred to as "the Buyer" which expression shall, unless repugnant to the context or meaning thereof, include its successors and permitted assigns)', {
        width: 500,
      });
      doc.moveDown(2);

      // WHEREAS
      doc.fontSize(12).font('Helvetica-Bold').text('WHEREAS:');
      doc.fontSize(11).font('Helvetica');
      doc.text('A. The Seller is engaged in the business of agricultural production and is the lawful producer/owner of agricultural produce.');
      doc.text('B. The Buyer is desirous of purchasing agricultural produce from the Seller.');
      doc.text('C. Both parties have agreed to enter into this Agreement on mutually acceptable terms and conditions as set forth herein.');
      doc.moveDown(1.5);

      // NOW THIS AGREEMENT
      doc.fontSize(12).font('Helvetica-Bold').text('NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:');
      doc.moveDown(1);

      // 1. PRODUCT DETAILS
      doc.fontSize(12).font('Helvetica-Bold').text('1. PRODUCT DETAILS');
      doc.fontSize(11).font('Helvetica');
      doc.text(`   Product Name: ${interaction.product.productName}`);
      doc.text(`   Product Type: ${interaction.product.type}`);
      doc.text(`   Category: ${interaction.product.category}`);
      doc.text(`   Price per Unit: ₹${interaction.product.pricePerUnit}`);
      if (interaction.sampleDetails?.quantity) {
        doc.text(`   Quantity: ${interaction.sampleDetails.quantity}`);
      }
      doc.moveDown(1.5);

      // 2. TERMS AND CONDITIONS
      doc.fontSize(12).font('Helvetica-Bold').text('2. TERMS AND CONDITIONS');
      doc.moveDown(0.5);

      const sections = [
        {
          title: '2.1 QUALITY STANDARDS',
          text: 'The Seller warrants that the produce shall conform to the agreed specifications and quality standards as per Food Safety and Standards Act, 2006 and Agricultural Produce Market Committee Act applicable in the respective state.',
        },
        {
          title: '2.2 DELIVERY',
          text: interaction.sampleDetails?.address
            ? `Delivery Address: ${interaction.sampleDetails.address}. The Seller shall deliver the produce within the agreed timeline unless prevented by force majeure events.`
            : 'Delivery terms to be mutually agreed upon. The Seller shall deliver the produce within the agreed timeline unless prevented by force majeure events.',
        },
        {
          title: '2.3 PAYMENT TERMS',
          text: 'Payment shall be made as per the terms agreed upon completion of delivery and quality verification. Payment mode shall comply with the provisions of the Indian Contract Act, 1872.',
        },
        {
          title: '2.4 RISK AND TITLE',
          text: 'Risk and title in the goods shall pass to the Buyer upon delivery and acceptance at the specified delivery location.',
        },
        {
          title: '2.5 WARRANTIES',
          text: 'The Seller warrants that:\na) The produce is grown/produced by the Seller and is free from any encumbrances\nb) The produce meets all applicable food safety and quality standards\nc) The Seller has all necessary licenses and permits for cultivation and sale',
        },
        {
          title: '2.6 INSPECTION AND ACCEPTANCE',
          text: 'The Buyer shall have the right to inspect the produce upon delivery. Any quality issues must be reported within 24 hours of delivery.',
        },
        {
          title: '2.7 DISPUTE RESOLUTION',
          text: 'Any disputes arising out of or in connection with this Agreement shall be resolved through:\na) Good faith negotiations between the parties\nb) If unresolved, through mediation\nc) If mediation fails, through arbitration as per the Arbitration and Conciliation Act, 1996\nd) The arbitration shall be conducted in English language\ne) The award of the arbitrator shall be final and binding on both parties',
        },
        {
          title: '2.8 JURISDICTION',
          text: 'This Agreement shall be governed by and construed in accordance with the laws of India.',
        },
        {
          title: '2.9 FORCE MAJEURE',
          text: 'Neither party shall be liable for any failure or delay in performing their obligations under this Agreement due to force majeure events including but not limited to acts of God, natural disasters, war, governmental actions, epidemics, or any other events beyond reasonable control.',
        },
        {
          title: '2.10 TERMINATION',
          text: 'Either party may terminate this Agreement by providing written notice if the other party:\na) Commits a material breach and fails to remedy within 15 days of written notice\nb) Becomes insolvent or enters into bankruptcy proceedings',
        },
        {
          title: '2.11 CONFIDENTIALITY',
          text: 'Both parties agree to maintain confidentiality of all business information exchanged during the course of this transaction.',
        },
        {
          title: '2.12 ENTIRE AGREEMENT',
          text: 'This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, and agreements.',
        },
      ];

      sections.forEach((section) => {
        doc.fontSize(11).font('Helvetica-Bold').text(section.title);
        doc.fontSize(10).font('Helvetica').text(section.text, { width: 500 });
        doc.moveDown(1);
      });

      // 3. COMMUNICATION HISTORY
      doc.addPage();
      doc.fontSize(12).font('Helvetica-Bold').text('3. COMMUNICATION HISTORY');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Initial Contact Date: ${new Date(interaction.createdAt).toLocaleDateString('en-IN')}`);
      doc.text(`Interaction Type: ${
        interaction.interactionType === 'express_interest'
          ? 'Express Interest'
          : interaction.interactionType === 'request_sample'
          ? 'Sample Request'
          : 'Shortlist'
      }`);
      doc.moveDown(0.5);

      if (interaction.buyerNotes) {
        doc.font('Helvetica-Bold').text("Buyer's Initial Notes:");
        doc.font('Helvetica').text(interaction.buyerNotes, { width: 500 });
        doc.moveDown(0.5);
      }

      if (interaction.farmerResponse) {
        doc.font('Helvetica-Bold').text("Seller's Response:");
        doc.font('Helvetica').text(interaction.farmerResponse, { width: 500 });
        doc.moveDown(0.5);
      }

      if (interaction.sampleDetails?.notes) {
        doc.font('Helvetica-Bold').text('Additional Notes:');
        doc.font('Helvetica').text(interaction.sampleDetails.notes, { width: 500 });
        doc.moveDown(0.5);
      }

      doc.text(`Last Updated: ${new Date(interaction.updatedAt).toLocaleDateString('en-IN')}`);
      doc.moveDown(2);

      // 4. DECLARATIONS
      doc.fontSize(12).font('Helvetica-Bold').text('4. DECLARATIONS');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text('The parties hereby declare that:');
      doc.text('a) They have read and understood all terms and conditions of this Agreement');
      doc.text('b) They enter into this Agreement voluntarily and without any coercion');
      doc.text('c) All information provided is true and accurate to the best of their knowledge');
      doc.text('d) They have the legal capacity and authority to enter into this Agreement');
      doc.moveDown(2);

      // 5. SIGNATURES
      doc.fontSize(12).font('Helvetica-Bold').text('5. SIGNATURES');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text('This Agreement is executed electronically with digital signatures of both parties.');
      doc.moveDown(1);

      doc.font('Helvetica-Bold').text("SELLER'S SIGNATURE:");
      if (interaction.contract?.farmerSignature) {
        doc.fontSize(16).font('Times-Italic').text(interaction.contract.farmerSignature, { indent: 20 });
        doc.fontSize(10).font('Helvetica').text(
          `Date: ${new Date(interaction.contract.farmerSignedAt!).toLocaleDateString('en-IN')}`,
          { indent: 20 }
        );
      } else {
        doc.fontSize(11).font('Helvetica').text('[Pending Signature]', { indent: 20 });
      }
      doc.moveDown(1.5);

      doc.font('Helvetica-Bold').text("BUYER'S SIGNATURE:");
      if (interaction.contract?.buyerSignature) {
        doc.fontSize(16).font('Times-Italic').text(interaction.contract.buyerSignature, { indent: 20 });
        doc.fontSize(10).font('Helvetica').text(
          `Date: ${new Date(interaction.contract.buyerSignedAt!).toLocaleDateString('en-IN')}`,
          { indent: 20 }
        );
      } else {
        doc.fontSize(11).font('Helvetica').text('[Pending Signature]', { indent: 20 });
      }
      doc.moveDown(2);

      // Footer
      doc.fontSize(10).font('Helvetica-Oblique').text('---END OF AGREEMENT---', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(9).text(
        'Note: This is a legally binding electronic document. By signing this agreement, both parties acknowledge their acceptance of all terms and conditions stated herein.',
        { align: 'center', width: 500 }
      );

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
