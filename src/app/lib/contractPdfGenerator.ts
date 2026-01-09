import { jsPDF } from 'jspdf';

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
  try {
    console.log('Starting PDF generation with jsPDF...');
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Extract data
    const farmerId = (interaction as any).farmerid || (interaction as any).farmerId || '';
    const buyerId = (interaction as any).buyerid || (interaction as any).buyerId || '';
    
    const farmerName = interaction.farmer?.contactPerson || 'N/A';
    const farmerCompany = interaction.farmer?.companyName || 'N/A';
    const farmerAddress = interaction.farmer?.address || 'N/A';
    const farmerEmail = interaction.farmer?.email || 'N/A';
    const farmerPhone = interaction.farmer?.phoneNumber || 'N/A';
    
    const buyerName = interaction.buyer?.fullName || 'N/A';
    const buyerCompany = interaction.buyer?.companyName || 'Individual';
    const buyerEmail = interaction.buyer?.email || 'N/A';
    const buyerPhone = interaction.buyer?.phoneNumber || 'N/A';
    
    const productName = interaction.product?.productName || 'N/A';
    const productType = interaction.product?.type || 'N/A';
    const productCategory = interaction.product?.category || 'N/A';
    const pricePerUnit = interaction.product?.pricePerUnit || 0;

    const payment = (interaction as any).payment;
    const quantity = interaction.sampleDetails?.quantity || 'N/A';
    const deliveryAddress = interaction.sampleDetails?.address || 'Delivery terms to be mutually agreed upon';
    
    let totalAmount = 0;
    let advancePayment = 0;
    let balancePayment = 0;
    let transactionId = 'N/A';
    let paymentDate = 'N/A';
    let paymentScreenshot = '';
    
    if (payment) {
      totalAmount = payment.totalAmount || 0;
      advancePayment = payment.advancePayment || payment.advanceAmount || (totalAmount * 0.1);
      balancePayment = payment.balancePayment || (totalAmount * 0.9);
      transactionId = payment.transactionId || 'Pending';
      paymentDate = payment.paymentDate || payment.submittedAt ? new Date(payment.paymentDate || payment.submittedAt).toLocaleDateString('en-IN') : 'Pending';
      paymentScreenshot = payment.screenshotUrl || '';
    }

    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const checkPageBreak = (space: number = 20) => {
      if (yPosition + space > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // === HEADER WITH LOGO ===
    doc.setFillColor(56, 142, 60);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('FARMERS DIRECT', pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Connecting Farmers Directly with Buyers | Fresh Produce from Farm to Table', pageWidth / 2, 19, { align: 'center' });
    doc.setFontSize(8);
    doc.text('www.farmersdirect.in | support@farmersdirect.in | +91-1800-XXX-XXXX', pageWidth / 2, 25, { align: 'center' });
    
    yPosition = 38;

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AGRICULTURAL PRODUCE SALE AGREEMENT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`This Agreement is made on ${today}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setDrawColor(200, 230, 201);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // BETWEEN
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BETWEEN:', margin, yPosition);
    yPosition += 8;

    // SELLER
    doc.setFontSize(11);
    doc.text('PARTY OF THE FIRST PART (SELLER):', margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${farmerName}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Company: ${farmerCompany}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Address: ${farmerAddress}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Email: ${farmerEmail}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Phone: ${farmerPhone}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Farmer ID: ${farmerId}`, margin, yPosition);
    yPosition += 5;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    let lines = doc.splitTextToSize('(Hereinafter referred to as "the Seller" which expression shall, unless repugnant to the context or meaning thereof, include its successors and permitted assigns)', pageWidth - margin * 2);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 4 + 6;

    checkPageBreak();

    // AND
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('AND', margin, yPosition);
    yPosition += 8;

    // BUYER
    doc.text('PARTY OF THE SECOND PART (BUYER):', margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${buyerName}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Company: ${buyerCompany}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Email: ${buyerEmail}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Phone: ${buyerPhone}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Buyer ID: ${buyerId}`, margin, yPosition);
    yPosition += 5;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    lines = doc.splitTextToSize('(Hereinafter referred to as "the Buyer" which expression shall, unless repugnant to the context or meaning thereof, include its successors and permitted assigns)', pageWidth - margin * 2);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 4 + 6;

    checkPageBreak();

    // WHEREAS
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('WHEREAS:', margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('A. The Seller is engaged in the business of agricultural production and is the lawful producer/owner of', margin, yPosition);
    yPosition += 4;
    doc.text('   agricultural produce.', margin, yPosition);
    yPosition += 5;
    doc.text('B. The Buyer is desirous of purchasing agricultural produce from the Seller.', margin, yPosition);
    yPosition += 5;
    doc.text('C. Both parties have agreed to enter into this Agreement on mutually acceptable terms and conditions', margin, yPosition);
    yPosition += 4;
    doc.text('   as set forth herein.', margin, yPosition);
    yPosition += 8;

    checkPageBreak();

    // NOW THIS AGREEMENT
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:', margin, yPosition);
    yPosition += 8;

    // 1. PRODUCT DETAILS
    doc.text('1. PRODUCT DETAILS', margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`   Product Name: ${productName}`, margin, yPosition);
    yPosition += 5;
    doc.text(`   Product Type: ${productType}`, margin, yPosition);
    yPosition += 5;
    doc.text(`   Category: ${productCategory}`, margin, yPosition);
    yPosition += 5;
    doc.setTextColor(46, 125, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(`   Price per Unit: ₹${pricePerUnit.toFixed(2)}`, margin, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    yPosition += 5;
    if (quantity !== 'N/A') {
      doc.text(`   Quantity: ${quantity}`, margin, yPosition);
      yPosition += 5;
    }
    yPosition += 5;

    checkPageBreak();

    // PAYMENT BREAKDOWN BOX
    if (totalAmount > 0) {
      doc.setFillColor(255, 252, 231);
      doc.setDrawColor(255, 193, 7);
      doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 35, 2, 2, 'FD');
      
      yPosition += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(230, 81, 0);
      doc.text('PAYMENT BREAKDOWN', margin + 3, yPosition);
      yPosition += 6;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Contract Value: ₹${totalAmount.toFixed(2)}`, margin + 3, yPosition);
      yPosition += 5;
      doc.setTextColor(220, 53, 69);
      doc.text(`10% Advance Payment: ₹${advancePayment.toFixed(2)} (Non-refundable)`, margin + 3, yPosition);
      yPosition += 5;
      doc.setTextColor(56, 142, 60);
      doc.text(`90% Balance Payment: ₹${balancePayment.toFixed(2)} (Before delivery)`, margin + 3, yPosition);
      yPosition += 5;
      doc.setTextColor(0, 0, 0);
      doc.text(`Transaction ID: ${transactionId} | Payment Date: ${paymentDate}`, margin + 3, yPosition);
      yPosition += 8;
    }

    checkPageBreak();

    // PAYMENT SCREENSHOT
    if (paymentScreenshot) {
      checkPageBreak(80);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('1.3 PAYMENT PROOF', margin, yPosition);
      yPosition += 6;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Payment Screenshot/Receipt:', margin, yPosition);
      yPosition += 6;
      
      try {
        // Fetch image and convert to base64
        const imageResponse = await fetch(paymentScreenshot);
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64Image = Buffer.from(imageBuffer).toString('base64');
          
          // Determine image type from URL or response
          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          const imageFormat = contentType.includes('png') ? 'PNG' : 'JPEG';
          const dataUrl = `data:${contentType};base64,${base64Image}`;
          
          // Add image to PDF with fixed width, auto height
          const imgWidth = pageWidth - margin * 2;
          const imgHeight = 70; // Fixed height
          doc.addImage(dataUrl, imageFormat, margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 5;
        } else {
          throw new Error('Failed to fetch image');
        }
      } catch (imageError) {
        console.error('Error adding payment screenshot to PDF:', imageError);
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(9);
        doc.text('Screenshot URL (Unable to embed image):', margin, yPosition);
        yPosition += 5;
        doc.setFontSize(8);
        const urlLines = doc.splitTextToSize(paymentScreenshot, pageWidth - margin * 2);
        doc.text(urlLines, margin, yPosition);
        yPosition += urlLines.length * 4;
      }
      
      yPosition += 8;
      checkPageBreak();
    }

    // 2. TERMS AND CONDITIONS
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('2. TERMS AND CONDITIONS', margin, yPosition);
    yPosition += 8;

    // 2.1
    doc.setFontSize(10);
    doc.text('2.1 QUALITY STANDARDS', margin, yPosition);
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    lines = doc.splitTextToSize('The Seller warrants that the produce shall conform to the agreed specifications and quality standards as per Food Safety and Standards Act, 2006 and Agricultural Produce Market Committee Act applicable in the respective state.', pageWidth - margin * 2);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 4 + 5;

    checkPageBreak();

    // 2.2
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('2.2 DELIVERY', margin, yPosition);
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(deliveryAddress, margin, yPosition);
    yPosition += 4;
    doc.text('The Seller shall deliver the produce within the agreed timeline unless prevented by force majeure events.', margin, yPosition);
    yPosition += 6;

    checkPageBreak();

    // 2.3 PAYMENT TERMS - Detailed
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('2.3 PAYMENT TERMS', margin, yPosition);
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Payment shall be made as per the terms agreed upon completion of delivery and quality verification.', margin, yPosition);
    yPosition += 4;
    doc.text('Payment mode shall comply with the provisions of the Indian Contract Act, 1872.', margin, yPosition);
    yPosition += 6;

    checkPageBreak();

    // Rest of terms 2.4 - 2.12
    const terms = [
      {
        num: '2.4',
        title: 'RISK AND TITLE',
        text: 'Risk and title in the goods shall pass to the Buyer upon delivery and acceptance at the specified delivery location.'
      },
      {
        num: '2.5',
        title: 'WARRANTIES',
        text: 'The Seller warrants that:\na) The produce is grown/produced by the Seller and is free from any encumbrances\nb) The produce meets all applicable food safety and quality standards\nc) The Seller has all necessary licenses and permits for cultivation and sale'
      },
      {
        num: '2.6',
        title: 'INSPECTION AND ACCEPTANCE',
        text: 'The Buyer shall have the right to inspect the produce upon delivery. Any quality issues must be reported within 24 hours of delivery.'
      },
      {
        num: '2.7',
        title: 'DISPUTE RESOLUTION',
        text: 'Any disputes arising out of or in connection with this Agreement shall be resolved through:\na) Good faith negotiations between the parties\nb) If unresolved, through mediation\nc) If mediation fails, through arbitration as per the Arbitration and Conciliation Act, 1996\nd) The arbitration shall be conducted in English language\ne) The award of the arbitrator shall be final and binding on both parties'
      },
      {
        num: '2.8',
        title: 'JURISDICTION',
        text: 'This Agreement shall be governed by and construed in accordance with the laws of India.'
      },
      {
        num: '2.9',
        title: 'FORCE MAJEURE',
        text: 'Neither party shall be liable for any failure or delay in performing their obligations under this Agreement due to force majeure events including but not limited to acts of God, natural disasters, war, governmental actions, epidemics, or any other events beyond reasonable control.'
      },
      {
        num: '2.10',
        title: 'TERMINATION',
        text: 'Either party may terminate this Agreement by providing written notice if the other party:\na) Commits a material breach and fails to remedy within 15 days of written notice\nb) Becomes insolvent or enters into bankruptcy proceedings'
      },
      {
        num: '2.11',
        title: 'CONFIDENTIALITY',
        text: 'Both parties agree to maintain confidentiality of all business information exchanged during the course of this transaction.'
      },
      {
        num: '2.12',
        title: 'ENTIRE AGREEMENT',
        text: 'This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, and agreements.'
      }
    ];

    terms.forEach(term => {
      checkPageBreak(15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${term.num} ${term.title}`, margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      lines = doc.splitTextToSize(term.text, pageWidth - margin * 2);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 4 + 5;
    });

    // 3. COMMUNICATION HISTORY
    checkPageBreak(30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('3. COMMUNICATION HISTORY', margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Initial Contact Date: ${new Date(interaction.createdAt).toLocaleDateString('en-IN')}`, margin, yPosition);
    yPosition += 5;
    const interactionTypeText = interaction.interactionType === 'express_interest' ? 'Express Interest' :
                                 interaction.interactionType === 'request_sample' ? 'Sample Request' : 'Shortlist';
    doc.text(`Interaction Type: ${interactionTypeText}`, margin, yPosition);
    yPosition += 8;

    if (interaction.buyerNotes) {
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.text("Buyer's Initial Notes:", margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      lines = doc.splitTextToSize(interaction.buyerNotes, pageWidth - margin * 2);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 4 + 6;
    }

    if (interaction.farmerResponse) {
      checkPageBreak(20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("Seller's Response:", margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      lines = doc.splitTextToSize(interaction.farmerResponse, pageWidth - margin * 2);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 4 + 6;
    }

    if (interaction.sampleDetails?.notes) {
      checkPageBreak(20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Notes:', margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      lines = doc.splitTextToSize(interaction.sampleDetails.notes, pageWidth - margin * 2);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 4 + 6;
    }

    doc.setFontSize(10);
    doc.text(`Last Updated: ${new Date(interaction.updatedAt).toLocaleDateString('en-IN')}`, margin, yPosition);
    yPosition += 8;

    // 4. DECLARATIONS
    checkPageBreak(35);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('4. DECLARATIONS', margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('The parties hereby declare that:', margin, yPosition);
    yPosition += 5;
    doc.setFontSize(9);
    doc.text('a) They have read and understood all terms and conditions of this Agreement', margin, yPosition);
    yPosition += 4;
    doc.text('b) They enter into this Agreement voluntarily and without any coercion', margin, yPosition);
    yPosition += 4;
    doc.text('c) All information provided is true and accurate to the best of their knowledge', margin, yPosition);
    yPosition += 4;
    doc.text('d) They have the legal capacity and authority to enter into this Agreement', margin, yPosition);
    yPosition += 8;

    // 5. SIGNATURES
    checkPageBreak(50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('5. SIGNATURES', margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('This Agreement is executed electronically with digital signatures of both parties.', margin, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'bold');
    doc.text("SELLER'S SIGNATURE:", margin, yPosition);
    yPosition += 6;
    
    if (interaction.contract?.farmerSignature) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(56, 142, 60);
      doc.text(`Signed by: ${interaction.contract.farmerSignature}`, margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${interaction.contract.farmerSignedAt}`, margin, yPosition);
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('[Pending Signature]', margin, yPosition);
      doc.setTextColor(0, 0, 0);
    }
    yPosition += 10;

    doc.setFont('helvetica', 'bold');
    doc.text("BUYER'S SIGNATURE:", margin, yPosition);
    yPosition += 6;
    
    if (interaction.contract?.buyerSignature) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(33, 150, 243);
      doc.text(`Signed by: ${interaction.contract.buyerSignature}`, margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${interaction.contract.buyerSignedAt}`, margin, yPosition);
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('[Pending Signature]', margin, yPosition);
      doc.setTextColor(0, 0, 0);
    }
    yPosition += 10;

    // End of Agreement
    checkPageBreak(15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('---END OF AGREEMENT---', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    lines = doc.splitTextToSize('Note: This is a legally binding electronic document. By signing this agreement, both parties acknowledge their acceptance of all terms and conditions stated herein.', pageWidth - margin * 2);
    doc.text(lines, pageWidth / 2, yPosition, { align: 'center' });

    // === PAGE 2: COMPANY AUTHORIZATION ===
    doc.addPage();
    yPosition = margin;

    // Header
    doc.setFillColor(56, 142, 60);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('FARMERS DIRECT', pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Connecting Farmers Directly with Buyers', pageWidth / 2, 19, { align: 'center' });
    doc.setFontSize(8);
    doc.text('www.farmersdirect.in | support@farmersdirect.in | +91-1800-XXX-XXXX', pageWidth / 2, 25, { align: 'center' });
    
    yPosition = 45;

    doc.setTextColor(56, 142, 60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPANY AUTHORIZATION & WITNESS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    lines = doc.splitTextToSize('This contract is facilitated by Farmers Direct platform which acts as a witness to this agreement. Both parties have been verified on our platform. Platform terms and conditions apply to this transaction.', pageWidth - margin * 2);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 5 + 15;

    // Seal
    doc.setDrawColor(220, 53, 69);
    doc.setLineWidth(2);
    doc.circle(pageWidth / 2, yPosition + 20, 25, 'S');
    doc.setTextColor(220, 53, 69);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FARMERS', pageWidth / 2, yPosition + 12, { align: 'center' });
    doc.text('DIRECT', pageWidth / 2, yPosition + 18, { align: 'center' });
    doc.setFontSize(8);
    doc.text('OFFICIAL SEAL', pageWidth / 2, yPosition + 24, { align: 'center' });
    doc.setFontSize(7);
    doc.text(today, pageWidth / 2, yPosition + 30, { align: 'center' });

    yPosition += 55;

    // Signatory
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Signatory:', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(56, 142, 60);
    doc.text('Vijay Murukesan', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Director & CEO, Farmers Direct', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(`Date: ${today}`, pageWidth / 2, yPosition, { align: 'center' });

    // Footer
    yPosition = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('This is a digitally generated contract facilitated by Farmers Direct platform', pageWidth / 2, yPosition, { align: 'center' });
    doc.text('Page 2 of 2', pageWidth / 2, yPosition + 5, { align: 'center' });

    // Convert to Buffer
    const pdfOutput = doc.output('arraybuffer');
    const buffer = Buffer.from(pdfOutput);
    
    console.log('PDF generation complete, buffer size:', buffer.length);
    return buffer;

  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw error;
  }
};
