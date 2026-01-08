# Acceptance Workflow Implementation

## Overview

Implemented a mutual acceptance system for buyer-farmer interactions, allowing both parties to accept or reject interactions, with a contract option when both accept.

## Features Implemented

### 1. Database Schema Updates

Added two new fields to the `interactions` collection:

- `farmerAccepted`: boolean | undefined (tracks farmer's acceptance status)
- `buyerAccepted`: boolean | undefined (tracks buyer's acceptance status)

### 2. API Updates (`/api/interactions/route.ts`)

#### PUT Endpoint Enhancement

Updated the PUT endpoint to handle acceptance fields:

```typescript
const { interactionId, status, farmerResponse, farmerAccepted, buyerAccepted } =
  await req.json();

// Handle acceptance fields
if (farmerAccepted !== undefined) {
  updateData.farmerAccepted = farmerAccepted;
}

if (buyerAccepted !== undefined) {
  updateData.buyerAccepted = buyerAccepted;
}
```

### 3. UI Implementation (`/account/[userId]/page.tsx`)

#### Status Display Section

Shows real-time acceptance status for both parties:

- ✅ Accepted (green)
- ❌ Rejected (red)
- ⏳ Pending (gray)

#### Farmer Action Buttons

Displayed when:

- User is a farmer (`userId.startsWith('FID')`)
- User owns the interaction (`isOwner`)
- Status is not 'completed' or 'rejected'
- Farmer hasn't accepted/rejected yet (`farmerAccepted === undefined`)

Buttons:

- ✅ Accept as Farmer (green)
- ❌ Reject as Farmer (red)

#### Buyer Action Buttons

Displayed when:

- User is a buyer (`userId.startsWith('BID')`)
- User owns the interaction (`isOwner`)
- Status is not 'completed' or 'rejected'
- Buyer hasn't accepted/rejected yet (`buyerAccepted === undefined`)

Buttons:

- ✅ Accept as Buyer (blue)
- ❌ Reject as Buyer (orange)

#### Enter Contract Button

Displayed when:

- Both farmer and buyer have accepted (`farmerAccepted && buyerAccepted`)
- Status is not 'completed'
- User owns the interaction (`isOwner`)

Features:

- Prominent golden gradient background
- Confirmation dialog before proceeding
- Sets interaction status to 'completed'

### 4. Handler Functions

#### `handleFarmerAction(interactionId, action)`

- Called when farmer clicks Accept/Reject
- Shows confirmation dialog
- Updates `farmerAccepted` to true/false
- Sets status to 'rejected' if farmer rejects
- Reloads page on success

#### `handleBuyerAction(interactionId, action)`

- Called when buyer clicks Accept/Reject
- Shows confirmation dialog
- Updates `buyerAccepted` to true/false
- Sets status to 'rejected' if buyer rejects
- Reloads page on success

#### `handleEnterContract(interactionId)`

- Called when either party clicks "Enter into Contract"
- Shows confirmation dialog
- Sets status to 'completed'
- Reloads page on success

## User Flow

### Farmer Workflow

1. Buyer creates interaction (Shortlist/Express Interest/Request Sample)
2. Farmer receives notification in "My Account"
3. Farmer can reply to buyer's note (chat interface)
4. Farmer clicks "✅ Accept as Farmer" or "❌ Reject as Farmer"
5. If accepted and buyer also accepts → "Enter into Contract" button appears

### Buyer Workflow

1. Buyer clicks action button on product page
2. Interaction created and visible in "My Account"
3. Buyer can view farmer's replies
4. Buyer clicks "✅ Accept as Buyer" or "❌ Reject as Buyer"
5. If accepted and farmer also accepts → "Enter into Contract" button appears

### Contract Establishment

1. Both parties must accept the interaction
2. Golden "Enter into Contract" button appears for both parties
3. Either party can click to formalize the contract
4. Status changes to 'completed'
5. Interaction is now a formal contract

## Status Transitions

```
pending → rejected (if either party rejects)
pending → pending (both accepted, waiting for contract)
pending → completed (contract entered after both accept)
```

## Visual Design

### Status Indicators

- Two-column grid showing farmer and buyer status
- Color-coded badges with icons
- Clean white background with subtle borders

### Action Buttons

- Farmer buttons: Green (accept) / Red (reject)
- Buyer buttons: Blue (accept) / Orange (reject)
- Contract button: Golden gradient with celebration emoji
- Hover effects for better interactivity

### Layout

- Action section has yellow/gold background (`#fff9e6`)
- Clear section header with 📋 icon
- Status display above action buttons
- Contract section has gradient background when eligible

## Error Handling

- Confirmation dialogs prevent accidental clicks
- Success/error messages via `alert()`
- Page reload on success to show updated state
- API error logging in console

## Data Integrity

- Acceptance fields are boolean or undefined (three-state)
- Status updates are atomic via MongoDB `$set`
- Both acceptance fields tracked independently
- Contract can only be entered when both parties accept

## Security Considerations

- `isOwner` check ensures only authorized users see action buttons
- InteractionId validation in API
- User type validation (`FID`/`BID` prefix check)
- Status checks prevent invalid state transitions

## Future Enhancements

- Email notifications when party accepts/rejects
- Contract generation with PDF export
- Timeline view of interaction history
- Bulk accept/reject for multiple interactions
- Analytics dashboard for acceptance rates
