# Product Verification System Implementation

## Overview
This document describes the implementation of the product verification system in the Farmers Direct application. The system allows users to submit products for catalog addition, which then require admin approval before appearing publicly.

## Architecture

### Database Schema
Products in MongoDB now include the following verification-related fields:

```typescript
{
  productId: string,           // Auto-generated sequential ID
  title: string,
  type: string,                 // vegetable, fruit, grain, etc.
  category: string,             // organic/non-organic
  description: string,
  price: number,                // Default 0, set by admin
  images: string[],             // Vercel Blob URLs
  videos: string[],
  adminNotes?: string,          // Notes from submitter to admin
  verificationStatus: 'pending' | 'verified',
  submittedBy: {
    userId: string,
    email: string,
    userType: string
  },
  verifiedAt?: Date,            // Set when approved
  verifiedBy?: string,          // Admin email who approved
  createdAt: Date,
  updatedAt: Date
}
```

## User Flow

### 1. Product Submission (/add-a-product)
**Location:** `/src/app/add-a-product/page.tsx`

**Features:**
- Form fields: Title, Type (dropdown), Description, Admin Notes
- Image upload (max 5MB, JPG/PNG/WEBP/GIF)
- Video URLs (optional)
- JWT authentication required
- Redirects to dashboard after successful submission

**API Endpoint:** `POST /api/products`
- Requires Bearer token authentication
- Auto-generates sequential productId
- Sets verificationStatus to 'pending'
- Stores submitter information (userId, email, userType)
- Returns success/failure response

**Image Upload:** `POST /api/upload-product-image`
- Validates file type and size
- Uploads to Vercel Blob storage in 'product-images/' folder
- Returns public URL for storage in product document

### 2. Public Product Listing (/)
**Location:** `/src/app/page.tsx`

**Features:**
- Displays only verified products (verificationStatus: 'verified')
- Search functionality across product titles
- "Add Product" button visible only to logged-in users
- Routes to /add-a-product for product submission

**API Endpoint:** `GET /api/products`
- Public endpoint (no authentication required)
- Filters products by verificationStatus: 'verified'
- Returns array of approved products only

### 3. Admin Product Management (/admin)
**Location:** `/src/app/admin/page.tsx`

**Features:**
- Product Management tab in admin panel
- Lists all pending products with metadata
- Expandable product cards showing full details
- Inline editing before approval
- Approve/Reject actions with confirmation

**Workflow:**
1. Admin views list of pending products
2. Clicks "Review" to expand product details
3. Clicks "Edit & Review" to enter edit mode
4. Can modify: title, type, category, description, price
5. Views: submitted images, admin notes, submitter info
6. Approves: Product becomes visible in public catalog
7. Rejects: Product is permanently deleted from database

**API Endpoints:**

#### `GET /api/products/pending`
- **Authentication:** Bearer token required
- **Authorization:** Admin role required
- **Returns:** Array of products with verificationStatus: 'pending'
- **Sorting:** By createdAt descending (newest first)

#### `PATCH /api/products/verify`
- **Authentication:** Bearer token required
- **Authorization:** Admin role required
- **Body:**
  ```json
  {
    "productId": "string",
    "action": "approve" | "reject",
    "updatedData": {         // Optional, only for approve
      "title": "string",
      "type": "string",
      "category": "string",
      "description": "string",
      "price": number
    }
  }
  ```
- **Actions:**
  - **Approve:** 
    - Updates product with edited data (if provided)
    - Sets verificationStatus to 'verified'
    - Records verifiedAt timestamp and verifiedBy admin email
    - Product becomes visible in public catalog
  - **Reject:**
    - Permanently deletes product from database
    - No record retained

## Security

### Authentication
- All product submission and admin endpoints require JWT authentication
- Token format: `Bearer <token>`
- Secret key: 'your-secret-key-change-in-production' (should be changed in production)

### Authorization
- Product submission: Any authenticated user
- Product management: Admin role only (userType: 'admin')
- Public product viewing: No authentication required (shows verified only)

### Data Validation
- **File uploads:**
  - Size limit: 5MB
  - Allowed types: JPG, PNG, WEBP, GIF
  - Validated on server side
- **Required fields:**
  - Title, type, description (enforced on submit)
  - Product type from predefined list (dropdown)

## File Storage
- **Service:** Vercel Blob
- **Path:** `product-images/{filename}`
- **Access:** Public URLs returned after upload
- **Cleanup:** Manual (URLs stored in database, files persist in Blob storage)

## UI Components

### Product Submission Form
- Clean, card-based layout
- Green theme matching site branding
- Real-time validation
- Loading states during submission
- Success/error snackbar notifications
- Image preview before upload
- Character counter for description

### Admin Product Management
- Tabbed interface (User Management | Product Management)
- Expandable product cards
- Two-stage review process:
  1. View mode (read-only)
  2. Edit mode (inline editing)
- Color-coded status indicators
- Confirmation dialogs for destructive actions
- Real-time list updates after approve/reject

## Error Handling

### Client-Side
- Form validation before submission
- File size/type checking before upload
- Network error catching with user-friendly messages
- Session expiration handling (redirect to login)

### Server-Side
- JWT verification errors (401 Unauthorized)
- Authorization failures (403 Forbidden)
- Missing required fields (400 Bad Request)
- Database operation errors (500 Internal Server Error)
- Detailed error logging to console

## Future Enhancements
- [ ] Email notifications to users when products are approved/rejected
- [ ] Rejection reasons stored with deleted products (soft delete)
- [ ] Bulk approve/reject operations
- [ ] Product analytics (submission rate, approval rate)
- [ ] Image compression on upload
- [ ] Multiple image deletion from Blob storage on product rejection
- [ ] Product editing by original submitter (before approval)
- [ ] Product version history tracking

## Testing Checklist
- [ ] Submit product as authenticated user
- [ ] Verify product appears in admin pending list
- [ ] Edit product details in admin panel
- [ ] Approve product and verify it appears in public catalog
- [ ] Reject product and verify it's removed from database
- [ ] Verify unauthenticated users cannot submit products
- [ ] Verify non-admin users cannot access product management
- [ ] Verify public catalog only shows verified products
- [ ] Test image upload size/type validation
- [ ] Test form field validation

## File Reference
- **Frontend Pages:**
  - `/src/app/add-a-product/page.tsx` - Product submission form
  - `/src/app/page.tsx` - Public product catalog
  - `/src/app/admin/page.tsx` - Admin product management

- **API Routes:**
  - `/src/app/api/products/route.ts` - GET (public), POST (submit)
  - `/src/app/api/products/pending/route.ts` - GET pending products
  - `/src/app/api/products/verify/route.ts` - PATCH approve/reject
  - `/src/app/api/upload-product-image/route.ts` - POST image upload

- **Database:**
  - Collection: `products`
  - Connection: `/src/app/db/mongodb.ts`

## Configuration
- JWT Secret: Environment variable or hardcoded (production should use env)
- Vercel Blob: Requires BLOB_READ_WRITE_TOKEN in environment
- MongoDB URI: Requires MONGODB_URI in .env.local
