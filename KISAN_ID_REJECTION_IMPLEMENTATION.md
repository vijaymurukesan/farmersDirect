# Kisan ID Rejection Implementation

## Overview

Complete implementation of Kisan ID rejection workflow with email notifications and reupload functionality.

## Features Implemented

### 1. Backend API (`/src/app/api/verification-docs/route.ts`)

- **Rejection Handling**: When admin rejects Kisan ID (documentType='kisanId', action='reject')
  - Stores `kisanIdRejectionReason` field with rejection reason
  - Stores `kisanIdRejectedAt` timestamp
  - Sets `documentStatus` to 'rejected'
  - Sends rejection email notification to farmer
- **Email Notification**: Uses `send-document-rejection-email` endpoint
  - Document Type: "Kisan Credit Card ID"
  - Includes rejection reason in email body
  - Farmer receives email with rejection details

### 2. Admin Panel (`/src/app/admin/page.tsx`)

#### Interface Updates

- Added new fields to `VerificationDoc` interface:
  - `kisanIdRejectionReason?: string`
  - `kisanIdRejectedAt?: string`

#### Status Display

- **Status Badge**: Shows three states
  - ✓ Verified (green) - when `documentStatus === 'verified'`
  - ✗ Rejected (red) - when `documentStatus === 'rejected'`
  - ⏳ Pending (orange) - default state

#### Rejection Reason Display

- Shows rejection details when Kisan ID is rejected:
  - Rejection reason in red bordered box
  - Timestamp showing when rejection occurred
  - Formatted date display (e.g., "Jan 15, 2025, 10:30 AM")

### 3. Verification Page (`/src/app/verification/page.tsx`)

#### Status Detection

- **fetchOptionalDocStatuses**: Enhanced to detect Kisan ID rejection
  - Checks `verificationDoc.documentStatus === 'rejected'`
  - Sets `optionalDocStatuses.kisanId = 'rejected'`
  - Stores rejection reason in `rejectionReasons.kisanId`

#### UI for Rejected Kisan ID

When `optionalDocStatuses.kisanId === 'rejected'`:

1. **Rejection Badge**: Shows "❌ Kisan ID Rejected - Reenter Required"
2. **Rejection Reason Display**:
   - Red bordered box with rejection details
   - Shows "Kisan Credit Card ID" and rejection reason
3. **Reupload Form**:
   - Orange bordered form for re-entering Kisan ID
   - Input field for new Kisan ID (monospace font, letter-spaced)
   - Consent checkbox (required)
   - Submit button: "🔄 Resubmit Kisan ID"

#### Resubmission Flow

1. Farmer enters new Kisan ID
2. Provides consent checkbox
3. Clicks "Resubmit Kisan ID" button
4. API call to `/api/submit-verification-docs`:
   - `verificationMethod: 'kisan'`
   - `kisanId: <new_value>`
   - `consent: true`
5. On success:
   - Status changes to 'pending'
   - Success message: "🎉 Kisan ID resubmitted successfully! Pending verification."
   - Updates localStorage and state
   - Farmer sees "⏳ Pending Admin Verification"

## User Flow

### Admin Workflow

1. Navigate to Admin Panel → Pending Verification
2. Expand farmer's details
3. View Kisan ID verification section
4. Click "✗ Reject Kisan ID Verification"
5. Enter rejection reason in modal
6. Confirm rejection
7. System:
   - Stores rejection reason and timestamp
   - Sends email to farmer
   - Updates status badge to "✗ Rejected"
   - Shows rejection details in admin panel

### Farmer Workflow

1. Receive rejection email notification
2. Log in to verification page
3. See rejection status: "❌ Kisan ID Rejected - Reenter Required"
4. Read rejection reason
5. Enter correct Kisan ID in reupload form
6. Provide consent
7. Click "🔄 Resubmit Kisan ID"
8. Status changes back to pending
9. Wait for admin to verify again

## Technical Details

### Database Fields

```javascript
{
  kisanId: string,
  kisanConsent: boolean,
  documentStatus: 'pending' | 'verified' | 'rejected',
  kisanIdRejectionReason: string,
  kisanIdRejectedAt: Date
}
```

### State Management

```typescript
// Verification page state
optionalDocStatuses: {
  kisanId: 'none' | 'pending' | 'verified' | 'rejected';
}

rejectionReasons: {
  kisanId: string | null;
}
```

### API Endpoints Used

1. **PATCH /api/verification-docs**

   - Action: 'reject'
   - DocumentType: 'kisanId'
   - Body: { rejectionReason }

2. **POST /api/send-document-rejection-email**

   - Called internally by verification-docs API
   - Sends email to farmer with rejection details

3. **POST /api/submit-verification-docs**
   - Resubmission of Kisan ID after rejection
   - Body: { kisanId, verificationMethod: 'kisan', consent }

## Email Template

- Subject: "Document Rejected - Action Required"
- Body includes:
  - Document name: "Kisan Credit Card ID"
  - Rejection reason
  - Instructions to re-upload
  - Link to verification page

## Error Handling

- Validates Kisan ID input before submission
- Requires consent checkbox
- Shows snackbar notifications for success/error
- Disables submit button when fields incomplete
- Loading states during API calls

## Testing Checklist

- [ ] Admin can reject Kisan ID with reason
- [ ] Rejection email sent to farmer
- [ ] Admin panel shows "✗ Rejected" status
- [ ] Admin panel displays rejection reason and timestamp
- [ ] Verification page detects rejected status
- [ ] Rejection reason shown to farmer
- [ ] Reupload form displayed
- [ ] Farmer can re-enter Kisan ID
- [ ] Consent required for resubmission
- [ ] Status changes to pending after resubmit
- [ ] Success notification shown
- [ ] localStorage and state updated correctly

## Files Modified

1. `/src/app/api/verification-docs/route.ts` - Rejection API logic
2. `/src/app/admin/page.tsx` - Admin panel UI and interface
3. `/src/app/verification/page.tsx` - Farmer verification page and reupload form

## Related Documentation

- See `EMAIL_SETUP.md` for email service configuration
- See `IMPLEMENTATION_SUMMARY.md` for overall project documentation
