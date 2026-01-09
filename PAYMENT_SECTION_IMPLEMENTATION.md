# Payment Section Implementation

## Overview

Successfully implemented a comprehensive payment processing section that displays to buyers when the contract status changes to 'payment' after both parties have signed the legal contract.

## Features Implemented

### 1. **Payment Display Trigger**

- Shows only when `interaction.status === 'payment'`
- Visible only to buyers (`userId.startsWith('BID')`)
- Only shown to the owner of the interaction (`isOwner`)

### 2. **Bank Transfer Details**

Displays Farmers Direct company bank account information:

- **Bank Name**: State Bank of India
- **Account Name**: Farmers Direct Pvt Ltd
- **Account Number**: 1234567890123456
- **IFSC Code**: SBIN0001234

### 3. **Payment Amounts**

Shows two key amounts:

- **Total Contract Value**: Full price from `interaction.product.pricePerUnit`
- **Advance Payment (10%)**: Calculated as 10% of total
- **Remaining 90%**: Displayed with note "will be paid before delivery"

### 4. **Transaction Reference Number**

- Auto-generated unique reference: `TXN` + last 12 characters of interaction.\_id (uppercase)
- Example: `TXNABC123DEF456G`
- User instructed to include this in payment remarks/description

### 5. **Payment Screenshot Upload**

- File input accepting `image/*` formats
- Image preview shown immediately after selection
- Real-time preview using FileReader API
- Validates file type (JPEG, PNG, WebP)
- Validates file size (<5MB)

### 6. **Submit Button**

- Uploads screenshot to `/api/upload-payment-screenshot`
- Uploads to Vercel Blob storage
- Updates interaction with payment data:
  - `transactionId`: Generated transaction reference
  - `advanceAmount`: 10% of total price
  - `totalAmount`: Full contract price
  - `screenshotUrl`: Vercel Blob URL
  - `submittedAt`: Current timestamp
  - `verificationStatus`: "pending"
- Disabled states:
  - When no screenshot selected
  - During upload process (shows "⏳ Uploading...")

### 7. **Payment Verification Pending View**

After successful submission:

- Shows large "⏳" icon
- Displays "Payment Verification Pending" message
- Explains that screenshot is under review
- Displays submitted screenshot for reference
- This view replaces the upload form once payment is submitted

## Technical Implementation

### Files Modified

1. **`/src/app/account/[userId]/page.tsx`**
   - Added payment state variables (lines ~140-142)
   - Added payment handler functions (lines ~750-820)
   - Added payment section UI (lines ~2267-2643)

### State Variables Added

```typescript
const [paymentScreenshot, setPaymentScreenshot] = useState<{
  [key: string]: File | null;
}>({});
const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<{
  [key: string]: string;
}>({});
const [paymentUploading, setPaymentUploading] = useState<{
  [key: string]: boolean;
}>({});
```

### Handler Functions Added

#### `handlePaymentScreenshotChange(interactionId, file)`

- Validates file type (JPEG, PNG, WebP)
- Validates file size (<5MB)
- Creates preview using FileReader
- Updates state with file and preview

#### `handlePaymentSubmit(interactionId)`

- Creates FormData with screenshot and userId
- Uploads to `/api/upload-payment-screenshot`
- Creates payment object with all required fields
- Updates interaction via PUT to `/api/interactions`
- Clears file and preview state on success

### API Endpoint Used

- **`POST /api/upload-payment-screenshot`**
  - Accepts multipart/form-data with file and userId
  - Validates JWT authentication
  - Uploads to Vercel Blob storage
  - Returns { url, fileName, fileSize, fileType }

## User Flow

1. **Contract Signing**: Both buyer and farmer sign the contract
2. **Status Change**: Status automatically changes to 'payment'
3. **Payment Section Appears**: Buyer sees payment UI with bank details
4. **Make Transfer**: Buyer transfers 10% advance to provided bank account
5. **Upload Screenshot**: Buyer uploads payment confirmation screenshot
6. **Preview**: Buyer reviews screenshot preview
7. **Submit**: Buyer clicks "Submit Payment Confirmation"
8. **Verification Pending**: UI changes to show pending verification status
9. **Admin Review**: (Future) Admin reviews and approves/rejects payment

## Styling

- **Main Container**: Blue gradient background (#e1f5fe to #b3e5fc)
- **Bank Details**: White box with blue border
- **Payment Amounts**: Yellow box (#fff9c4) with orange border (#f57f17)
- **Transaction Reference**: Green box (#e8f5e9) with monospace font
- **Upload Section**: White box with dashed blue border
- **Submit Button**: Blue background (#0277bd), disabled state is gray
- **Verification Pending**: Orange theme (#fff3e0, #ff9800)

## Integration with Contract System

The payment section appears automatically after:

1. Buyer accepts farmer's proposal (creates contract)
2. Buyer signs contract
3. Farmer signs contract
4. System changes status from 'contract' to 'payment'
5. "Contract Fully Signed!" message is shown
6. Payment section appears below it (for buyers only)

## Future Enhancements (Suggested)

- Admin panel for payment verification
- Email notifications when payment is verified/rejected
- Payment history tracking
- Multiple payment support (10% advance + 90% final)
- Payment receipt generation
- Refund processing for failed transactions
