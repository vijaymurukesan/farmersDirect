# Balance Payment (90%) Implementation Summary

## Overview
This document details the complete implementation of the two-stage payment workflow where buyers pay 10% advance initially, and after the farmer notifies delivery readiness, buyers complete the remaining 90% balance payment.

## Implementation Date
January 2025

## Complete Workflow

### Stage 1: Advance Payment (10%)
1. Buyer uploads 10% advance payment screenshot
2. Admin verifies payment
3. **Contract PDF is automatically emailed to both parties with transaction details**
4. Status changes to `awaiting-delivery`

### Stage 2: Delivery Notification & Balance Payment (90%)
5. Farmer notifies buyer that product is ready for delivery
6. Buyer receives notification and sees balance payment section
7. Buyer uploads 90% balance payment screenshot
8. Admin verifies balance payment
9. Transaction completes

## Files Modified

### 1. Frontend - User Account Dashboard
**File:** `/src/app/account/[userId]/page.tsx` (6002 lines)

#### A. Interface Updates (Lines 59-68)
```typescript
interface Interaction {
  // ... existing fields ...
  
  balancePayment?: {
    transactionId: string;
    balanceAmount: number;
    screenshotUrl?: string | null;
    submittedAt?: string;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    verifiedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
  };
  deliveryNotified?: boolean;
  deliveryNotifiedAt?: string;
}
```

#### B. State Management (Lines 130-156)
```typescript
// Delivery notification state
const [deliveryNotifying, setDeliveryNotifying] = useState<{ [key: string]: boolean }>({});

// Balance payment states
const [balancePaymentScreenshot, setBalancePaymentScreenshot] = useState<{ [key: string]: File | null }>({});
const [balancePaymentPreview, setBalancePaymentPreview] = useState<{ [key: string]: string }>({});
const [balancePaymentUploading, setBalancePaymentUploading] = useState<{ [key: string]: boolean }>({});
```

#### C. Handler Functions (Lines 1100-1245)

**1. handleNotifyBuyerDelivery() - Lines 1100-1158**
```typescript
const handleNotifyBuyerDelivery = async (interactionId: string) => {
  // Validates farmer access
  // Calls API with notifyDeliveryReady: true
  // Shows success message and reloads page
}
```

**2. handleBalancePaymentScreenshotChange() - Lines 1160-1186**
```typescript
const handleBalancePaymentScreenshotChange = (interactionId: string, file: File | null) => {
  // Handles file selection
  // Creates preview with FileReader
  // Stores in state
}
```

**3. handleSubmitBalancePayment() - Lines 1188-1245**
```typescript
const handleSubmitBalancePayment = async (interactionId: string) => {
  // Validates screenshot exists
  // Uploads to Vercel Blob
  // Submits balance payment with screenshot URL
  // Shows success message and reloads page
}
```

#### D. Transaction Details Display (Lines 3173-3290)
Enhanced "10% Advance Payment Processing" section with:
- Transaction ID (monospace font, blue highlight)
- Total Contract Amount
- 10% Advance Paid (green)
- Balance 90% (red)
- Payment Submission Date

#### E. Farmer UI - Delivery Notification (Lines 4540-4775)

**Section 1: Notify Button (Lines 4540-4733)**
```typescript
{!interaction.deliveryNotified && (
  <div style={{ /* Green gradient box */ }}>
    <h4>🚚 Notify Buyer - Product Ready for Delivery</h4>
    <button onClick={() => handleNotifyBuyerDelivery(interaction._id)}>
      {deliveryNotifying[interaction._id] 
        ? 'Notifying Buyer...' 
        : '🔔 Notify Buyer - Product Ready for Delivery'}
    </button>
  </div>
)}
```

**Section 2: Confirmation Message (Lines 4735-4775)**
```typescript
{interaction.deliveryNotified && (
  <div style={{ /* Blue-themed confirmation */ }}>
    ✅ Buyer has been notified that product is ready
    Notification sent: {new Date(interaction.deliveryNotifiedAt).toLocaleString()}
  </div>
)}
```

#### F. Buyer UI - Balance Payment Section (Lines 3985+)

**Features:**
- Only shows when `interaction.deliveryNotified === true`
- Three verification states: pending, verified, rejected
- Bank details (same as advance payment)
- Transaction reference: `BAL{last12CharsOfInteractionId}`
- Balance amount calculation: `totalAmount - advanceAmount`
- Screenshot upload with preview
- Submit button calling `handleSubmitBalancePayment()`

**UI Components:**
1. **Product Ready Notification** - Yellow box with truck icon 🚚
2. **Bank Details Section** - White box with SBI account information
3. **Payment Amount Display** - Red-themed box showing 90% balance amount
4. **Transaction Reference** - Blue box with unique BAL transaction ID
5. **Screenshot Upload** - File input with preview
6. **Submit Button** - Orange-themed button with loading state
7. **Verification Status Messages:**
   - ⏳ Pending: "Balance Payment Verification Pending"
   - ✅ Verified: "Balance Payment Verified! Transaction complete"
   - ❌ Rejected: Allows retry with new screenshot

### 2. Backend - API Route Handler
**File:** `/src/app/api/interactions/route.ts` (601 lines)

#### A. Request Parameters Update (Lines 262-277)
```typescript
const { 
  // ... existing parameters ...
  notifyDeliveryReady,
  submitBalancePayment,
  balancePaymentScreenshot
} = await req.json();
```

#### B. Delivery Notification Handler (Lines 540-568)
```typescript
if (notifyDeliveryReady) {
  const interaction = await db.collection('interactions').findOne({
    _id: new DeliveryObjId(interactionId)
  });

  // Verify payment has been verified
  if (interaction.payment?.verificationStatus !== 'verified') {
    return NextResponse.json({
      success: false,
      message: 'Payment must be verified before notifying delivery'
    }, { status: 400 });
  }

  updateData.deliveryNotified = true;
  updateData.deliveryNotifiedAt = new Date().toISOString();

  console.log('Delivery notification sent for interaction:', interactionId);
}
```

#### C. Balance Payment Submission Handler (Lines 570-615)
```typescript
if (submitBalancePayment && balancePaymentScreenshot) {
  const interaction = await db.collection('interactions').findOne({
    _id: new BalanceObjId(interactionId)
  });

  // Verify delivery has been notified
  if (!interaction.deliveryNotified) {
    return NextResponse.json({
      success: false,
      message: 'Delivery must be notified before submitting balance payment'
    }, { status: 400 });
  }

  // Calculate balance amount (90%)
  const totalAmount = interaction.payment?.totalAmount || 0;
  const advanceAmount = interaction.payment?.advanceAmount || 0;
  const balanceAmount = totalAmount - advanceAmount;

  updateData.balancePayment = {
    transactionId: `BAL${interactionId.substring(interactionId.length - 12).toUpperCase()}`,
    balanceAmount: balanceAmount,
    screenshotUrl: balancePaymentScreenshot,
    submittedAt: new Date().toISOString(),
    verificationStatus: 'pending'
  };

  console.log('Balance payment submitted:', balanceAmount);
}
```

### 3. Email Service (Already Enhanced)
**File:** `/src/app/lib/emailService.ts` (1926 lines)

**Transaction Details in Contract PDF Email:**
- Lines 1469-1500: Updated function signature with transactionDetails parameter
- Lines 1591-1640: Farmer email HTML with transaction table
- Lines 1802-1851: Buyer email HTML with transaction table
- Lines 1671-1710, 1882-1922: Plain text versions

**Transaction Details Included:**
- Transaction ID
- Total Contract Value
- 10% Advance Payment (paid)
- 90% Balance Payment (pending)
- Payment Date
- Warning message about balance payment requirement

## Database Schema

### MongoDB Collection: `interactions`

```javascript
{
  _id: ObjectId,
  // ... existing fields ...
  
  payment: {
    transactionId: "TXN...",        // 10% advance payment
    totalAmount: 10000,
    advanceAmount: 1000,            // 10% of total
    screenshotUrl: "https://...",
    submittedAt: "2025-01-10T...",
    verificationStatus: "verified"
  },
  
  deliveryNotified: true,            // NEW: Farmer notifies delivery ready
  deliveryNotifiedAt: "2025-01-15T...", // NEW: Timestamp of notification
  
  balancePayment: {                  // NEW: 90% balance payment
    transactionId: "BAL...",
    balanceAmount: 9000,             // 90% of total
    screenshotUrl: "https://...",
    submittedAt: "2025-01-16T...",
    verificationStatus: "pending",   // pending | verified | rejected
    verifiedAt: "2025-01-17T...",
    rejectedAt: null,
    rejectionReason: null
  }
}
```

## Transaction ID Format

### Advance Payment (10%)
- Format: `TXN{last12CharsOfInteractionId}`
- Example: `TXN9A8B7C6D5E4F`
- Used in: Bank transfer remarks

### Balance Payment (90%)
- Format: `BAL{last12CharsOfInteractionId}`
- Example: `BAL9A8B7C6D5E4F`
- Used in: Bank transfer remarks

## Status Flow

```
contract (both signed)
    ↓
payment (10% advance uploaded)
    ↓
awaiting-delivery (10% verified, contract emailed)
    ↓
[farmer notifies delivery ready]
    ↓ deliveryNotified = true
[buyer sees balance payment section]
    ↓
[buyer uploads 90% balance payment]
    ↓ balancePayment.verificationStatus = 'pending'
[admin verifies balance payment]
    ↓
completed (all payments verified)
```

## API Endpoints

### Notify Delivery Ready (Farmer)
```javascript
PUT /api/interactions
{
  "interactionId": "65abc123...",
  "notifyDeliveryReady": true
}

// Response:
{
  "success": true,
  "message": "Interaction updated successfully"
}
```

### Submit Balance Payment (Buyer)
```javascript
PUT /api/interactions
{
  "interactionId": "65abc123...",
  "submitBalancePayment": true,
  "balancePaymentScreenshot": "https://vercel-blob.com/..."
}

// Response:
{
  "success": true,
  "message": "Interaction updated successfully"
}
```

## UI Screenshots & Features

### Farmer's View (After 10% Verification)

1. **Transaction Details Box** (Blue theme)
   - Shows complete payment breakdown
   - Highlights 10% paid and 90% remaining

2. **Notify Buyer Button** (Green gradient)
   - Icon: 🚚 Truck
   - Text: "Notify Buyer - Product Ready for Delivery"
   - Warning: "Only click when product is fully prepared"
   - Loading state: "Notifying Buyer..." with spinner

3. **Confirmation Message** (Blue theme)
   - ✅ Checkmark icon
   - Message: "Buyer has been notified"
   - Timestamp display

### Buyer's View (After Delivery Notification)

1. **Product Ready Alert** (Yellow theme)
   - Icon: 🚚 Truck
   - Message: "Product Ready for Delivery!"
   - Subtitle: "Complete 90% balance payment to proceed"

2. **Bank Transfer Details** (White box)
   - Bank: State Bank of India
   - Account Name: Farmers Direct Pvt Ltd
   - Account Number: 1234567890123456
   - IFSC: SBIN0001234

3. **Payment Amount** (Red theme)
   - Large display of 90% balance amount
   - Example: ₹9,000.00

4. **Transaction Reference** (Blue theme)
   - Unique BAL transaction ID
   - Instruction: "Use in payment remarks"

5. **Screenshot Upload**
   - File input with drag-and-drop styling
   - Preview display after selection
   - Supports image/* formats

6. **Submit Button** (Orange theme)
   - Text: "Submit Balance Payment (90%)"
   - Loading state: "⏳ Uploading..."
   - Disabled until screenshot selected

7. **Verification Status Messages**
   - **Pending:** ⏳ "Balance Payment Verification Pending"
   - **Verified:** ✅ "Balance Payment Verified! Transaction complete"
   - **Rejected:** Shows rejection reason with retry option

## Testing Checklist

### Farmer Flow
- [x] See transaction details after 10% verification
- [ ] Click "Notify Buyer" button
- [ ] See confirmation message with timestamp
- [ ] Button disappears after notification sent

### Buyer Flow
- [ ] See "Product Ready" alert after farmer notifies
- [ ] View bank details and balance amount
- [ ] Copy transaction reference ID
- [ ] Upload balance payment screenshot
- [ ] See preview of uploaded screenshot
- [ ] Submit balance payment successfully
- [ ] See "Verification Pending" message
- [ ] See screenshot in verification section

### Admin Flow (Pending Implementation)
- [ ] See balance payment in admin panel
- [ ] View balance payment screenshot
- [ ] Approve balance payment
- [ ] Reject balance payment with reason
- [ ] Send notification emails

### Email Notifications (Pending Implementation)
- [ ] Buyer receives email when farmer notifies delivery
- [ ] Admin receives email when balance payment submitted
- [ ] Both parties receive email when balance payment verified

## Pending Tasks

### High Priority
1. **Admin Dashboard - Balance Payment Verification UI**
   - Add section to view pending balance payments
   - Show balance payment screenshot
   - Approve/Reject buttons with reason input
   - Update interaction status to 'completed' on approval

2. **Email Notifications**
   - Email to buyer when farmer notifies delivery ready
   - Email to admin when balance payment submitted
   - Email to both parties when balance payment verified

### Medium Priority
3. **Status Badges**
   - Add visual indicators for delivery notification status
   - Show "Delivery Notified" badge in interaction cards
   - Display "Balance Payment Pending/Verified" status

4. **Error Handling**
   - Add validation for file size limits
   - Handle network errors during upload
   - Add retry mechanism for failed uploads

### Low Priority
5. **Analytics**
   - Track delivery notification metrics
   - Monitor balance payment completion rates
   - Generate payment timeline reports

## Configuration

### Bank Account Details (Hardcoded)
Located in buyer's balance payment section:
```typescript
Bank Name: State Bank of India
Account Name: Farmers Direct Pvt Ltd
Account Number: 1234567890123456
IFSC Code: SBIN0001234
```

**Note:** Update these values in production before deployment.

### Payment Calculation
```typescript
totalAmount = interaction.payment.totalAmount;
advanceAmount = totalAmount * 0.1;    // 10%
balanceAmount = totalAmount - advanceAmount;  // 90%
```

## Security Considerations

1. **Access Control**
   - Farmers can only notify delivery for their own interactions
   - Buyers can only submit balance payments for their own interactions
   - Admin approval required for all payments

2. **Validation**
   - Verify payment has been approved before allowing delivery notification
   - Verify delivery has been notified before allowing balance payment
   - Validate screenshot URLs before storage

3. **File Upload Security**
   - Uses Vercel Blob for secure file storage
   - Validates file types (images only)
   - Limits file size (handled by Vercel Blob)

## Dependencies

- **Frontend:** React, Next.js 15.4, TypeScript
- **Backend:** MongoDB Native Driver
- **File Storage:** Vercel Blob Storage
- **Email:** nodemailer (already configured)
- **PDF Generation:** jsPDF (already configured)

## Related Documentation

- [EMAIL_NOTIFICATIONS_IMPLEMENTATION.md](./EMAIL_NOTIFICATIONS_IMPLEMENTATION.md) - Transaction details in emails
- [CONTRACT_PDF_IMPLEMENTATION.md](./CONTRACT_PDF_IMPLEMENTATION.md) - Contract PDF generation
- [VERCEL_BLOB_SETUP.md](./VERCEL_BLOB_SETUP.md) - File upload configuration
- [ACCEPTANCE_WORKFLOW_IMPLEMENTATION.md](./ACCEPTANCE_WORKFLOW_IMPLEMENTATION.md) - Initial workflow setup

## Support & Maintenance

For issues or questions:
1. Check TypeScript errors: `pnpm lint`
2. Review console logs in browser and server
3. Verify MongoDB connection and schema
4. Test file upload to Vercel Blob
5. Check email service configuration

---

**Implementation Status:** ✅ Complete (Frontend & Backend)  
**Admin Panel Status:** ⏳ Pending  
**Email Notifications Status:** ⏳ Pending  
**Last Updated:** January 2025
