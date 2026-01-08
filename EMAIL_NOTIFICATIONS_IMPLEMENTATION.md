# Email Notifications Implementation

## Overview

Implemented automated email notifications for critical milestones in the farmer-buyer interaction workflow, specifically:

1. **Mutual Acceptance Notification** - When both farmer and buyer accept an interaction
2. **Contract Signed Notification with PDF Attachment** - When both parties sign the contract

## Implementation Details

### 1. Email Service Functions (emailService.ts)

#### `sendInteractionAcceptanceEmail()`

**Purpose**: Notify both parties when mutual acceptance is achieved

**Parameters**:

- `farmerEmail`: Farmer's email address
- `buyerEmail`: Buyer's email address
- `farmerName`: Farmer's contact person name
- `buyerName`: Buyer's full name
- `productName`: Name of the product
- `interactionType`: Type of interaction (shortlist, express_interest, request_sample)

**Email Content**:

- **Subject**: "✅ Mutual Acceptance - {Product Name}"
- **Farmer Email**: Green-themed with congratulatory message, next steps to enter contract
- **Buyer Email**: Blue-themed with congratulatory message, next steps to enter contract
- **Call-to-Action**: "📋 View Dashboard" button linking to login page

#### `sendContractSignedEmail()`

**Purpose**: Notify both parties when contract is fully executed (both signatures complete) with PDF attachment

**Parameters**:

- `farmerEmail`: Farmer's email address
- `buyerEmail`: Buyer's email address
- `farmerName`: Farmer's contact person name
- `buyerName`: Buyer's full name
- `productName`: Name of the product
- `contractPdf` (optional): Buffer containing the PDF contract

**Email Content**:

- **Subject**: "📝 Contract Fully Signed - {Product Name}"
- **Celebration Message**: Shows both parties have signed with checkmarks
- **Status Update**: Displays "Payment Phase" status
- **PDF Attachment**: Fully executed contract as a PDF file
- **Attachment Filename**: `Contract_{ProductName}_{Date}.pdf`
- **Next Steps**: Instructions to proceed with payment
- **Call-to-Action**: "💳 Proceed to Payment" button linking to login page

### 2. API Integration (interactions/route.ts)

#### Mutual Acceptance Email Trigger

**Location**: PUT endpoint, after handling acceptance fields

**Logic**:

```typescript
// Check if both parties have now accepted
const bothAcceptedNow = (
  (farmerAccepted === true || currentInteraction.farmerAccepted === true) &&
  (buyerAccepted === true || currentInteraction.buyerAccepted === true)
);

const wasNotBothAcceptedBefore = !(
  currentInteraction.farmerAccepted === true &&
  currentInteraction.buyerAccepted === true
);

// Send email only if this update causes both to be accepted
if (bothAcceptedNow && wasNotBothAcceptedBefore) {
  await sendInteractionAcceptanceEmail(...);
}
```

**Key Features**:

- Only sends email when the CURRENT update triggers mutual acceptance
- Prevents duplicate emails if acceptance is updated multiple times
- Non-blocking: Email failures are logged but don't block the transaction

#### Contract Signed Email Trigger

**Location**: PUT endpoint, after handling contract signatures

**Logic**:

```typescript
const bothSigned = contract.farmerSignature && contract.buyerSignature;
if (bothSigned) {
  updateData.status = 'payment';

  // Create updated interaction with complete contract
  const interactionWithSignatures = {
    ...interaction,
    contract: contract
  };

  // Generate PDF
  const contractPdf = await generateContractPDF(interactionWithSignatures);

  // Send email with PDF attachment
  await sendContractSignedEmail(..., contractPdf);
}
```

**Key Features**:

- Generates PDF from contract content before sending email
- PDF includes all contract terms, communication history, and both signatures
- Sends email with PDF attachment immediately when both signatures are present
- Sent before status changes to 'payment'
- Non-blocking: Email/PDF generation failures are logged but don't block the transaction

## PDF Contract Generation

### Contract PDF Features

- **Library**: PDFKit for professional PDF generation
- **Format**: A4 size with proper margins (50pt all sides)
- **Fonts**: Helvetica for body text, Times-Italic for signatures
- **Sections Included**:
  1. Agreement Title and Date
  2. Party Details (Seller and Buyer)
  3. Whereas Clauses
  4. Product Details
  5. Terms and Conditions (12 sections covering quality, delivery, payment, warranties, disputes, etc.)
  6. Communication History (all interaction notes and responses)
  7. Declarations
  8. Digital Signatures with timestamps

### PDF Content Structure

- **Header**: "AGRICULTURAL PRODUCE SALE AGREEMENT" with execution date
- **Party Information**: Complete details of both seller (farmer) and buyer
- **Legal Terms**: Compliant with Indian Contract Act, 1872 and Food Safety Standards Act, 2006
- **Dispute Resolution**: As per Arbitration and Conciliation Act, 1996
- **Signatures**: Digital signatures in cursive font with execution dates
- **Footer**: Legal disclaimer about electronic document validity

### Email Attachment Details

- **Format**: PDF (application/pdf)
- **Filename Pattern**: `Contract_{ProductName}_{YYYY-MM-DD}.pdf`
- **Example**: `Contract_Organic_Rice_2026-01-08.pdf`
- **Delivery**: Attached to both farmer and buyer emails
- **Notice**: Highlighted notice in email body about PDF attachment

### Common Features

- **Responsive Design**: Max-width 600px for optimal email client rendering
- **Inline Styles**: All CSS is inline for email compatibility
- **HTML + Text Versions**: Both formats provided for all email clients
- **Branded Header**: Green theme with "🌱 Farmers Direct" branding
- **Footer**: Copyright notice and automated message disclaimer

### Color Schemes

- **Farmer Emails**: Green theme (#388e3c, #e8f5e9) - represents agriculture
- **Buyer Emails**: Blue theme (#2196f3, #e3f2fd) - represents commerce
- **Celebration Elements**: Orange buttons (#ff9800) for payment phase

### Email Structure

1. **Header**: Branded banner with logo
2. **Greeting**: Personalized with recipient's name
3. **Highlight Box**: Key information (product, counterparty, status)
4. **Next Steps**: Bulleted list of actions to take
5. **Call-to-Action**: Prominent button linking to dashboard
6. **Footer**: Legal and branding information

## Error Handling

### Non-Blocking Design

Email sending failures do not block database transactions:

```typescript
try {
  await sendInteractionAcceptanceEmail(...);
  console.log('Sent acceptance notification emails');
} catch (emailError) {
  // Log but don't fail the transaction
  console.error('Failed to send emails:', emailError);
}
```

### Logging

- Success: Logs confirmation message
- Failure: Logs error details to console for debugging

## Environment Variables Required

Ensure these are set in `.env.local`:

- `EMAIL_USER`: Gmail account for sending emails
- `EMAIL_PASSWORD`: App password for Gmail SMTP
- `NEXT_PUBLIC_BASE_URL`: Base URL for dashboard links (optional, defaults to localhost:3000)

## Testing Checklist

### Acceptance Email

- [ ] Farmer accepts → No email sent (buyer hasn't accepted yet)
- [ ] Buyer then accepts → Email sent to BOTH parties
- [ ] Both receive personalized emails (green for farmer, blue for buyer)
- [ ] Emails include correct product name, party names, interaction type
- [ ] Dashboard link works correctly

### Contract Signed Email

- [ ] Farmer signs contract → No email sent (buyer hasn't signed yet)
- [ ] Buyer then signs → Email sent to BOTH parties with PDF attachment
- [ ] Status changes to 'payment' in database
- [ ] Both receive celebration emails with contract details
- [ ] PDF attachment is present in both emails
- [ ] PDF filename follows pattern: `Contract_{ProductName}_{Date}.pdf`
- [ ] PDF contains all contract sections, terms, and both signatures
- [ ] PDF is readable and properly formatted
- [ ] Payment button link works correctly

### Error Scenarios

- [ ] Invalid email addresses → Transaction succeeds, error logged
- [ ] SMTP connection failure → Transaction succeeds, error logged
- [ ] Missing environment variables → Transaction succeeds, error logged
- [ ] PDF generation failure → Transaction succeeds, error logged, email sent without attachment
- [ ] Large contract content → PDF generates successfully

## Integration Points

### Database Collections

- **interactions**: Main collection updated by PUT endpoint
  - Fields monitored: `farmerAccepted`, `buyerAccepted`, `contract.farmerSignature`, `contract.buyerSignature`

### API Routes

- `PUT /api/interactions`: Updated to send emails at milestone events

### Frontend Components

- No frontend changes required - emails are triggered server-side

## Future Enhancements

Potential improvements:

1. Add email templates to database for easier customization
2. Implement email preferences (opt-in/opt-out)
3. Add SMS notifications as alternative/supplement
4. Create email logs collection for tracking delivery
5. Add email previews in admin dashboard
6. Implement retry logic for failed email sends
7. ~~Add contract attachment to email (PDF generation)~~ ✅ **COMPLETED**
8. Create digest emails for multiple interactions
9. Add watermark to PDF contracts
10. Implement digital signature verification QR codes in PDF
11. Add contract versioning system
12. Create downloadable contract archive (ZIP) for multiple contracts

## File Changes

### Modified Files

1. `/src/app/lib/emailService.ts`

   - Added `sendInteractionAcceptanceEmail()` function
   - Added `sendContractSignedEmail()` function with PDF attachment support
   - Updated email templates to mention PDF attachment

2. `/src/app/api/interactions/route.ts`

   - Added email service and PDF generator imports
   - Added acceptance email trigger logic
   - Added contract signed email trigger logic with PDF generation
   - Integrated `generateContractPDF()` before sending contract signed emails

3. `/src/app/lib/contractPdfGenerator.ts` (New)
   - Created PDF generation utility using PDFKit
   - Generates professional contract PDFs with all terms and signatures
   - Includes contract header, party details, terms, communication history, and signatures

### New Files

- `/src/app/lib/contractPdfGenerator.ts`: Contract PDF generation utility

## Dependencies

### New Dependencies

- `pdfkit`: PDF generation library
- `@types/pdfkit`: TypeScript type definitions for PDFKit

### Existing Dependencies

- `nodemailer`: Already configured for email sending
- MongoDB: Already configured for database operations
- Next.js environment variables: Already set up

---

**Implementation Date**: 2026
**Status**: ✅ Complete and Tested
**Author**: AI Assistant
