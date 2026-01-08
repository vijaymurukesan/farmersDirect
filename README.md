This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API Endpoints

### Interactions API

**POST `/api/interactions`**

Create a new interaction (shortlist, express interest, or request sample) between a buyer and farmer.

**Request Body Structure:**

```json
{
  "interactionType": "shortlist | express_interest | request_sample",
  "farmerId": "FID001",
  "buyerId": "BID001",

  // Farmer details
  "farmerEmail": "farmer@example.com",
  "farmerContactPerson": "John Doe",
  "farmerCompanyName": "Farm Co.",
  "farmerPhoneNumber": "+91...",
  "farmerAddress": "...",
  "farmerMapLocation": { "lat": 0, "lng": 0 },

  // Buyer details
  "buyerEmail": "buyer@example.com",
  "buyerFullName": "Jane Smith",
  "buyerCompanyName": "Buyer Corp",
  "buyerPhoneNumber": "+91...",

  // Product details
  "productId": "3",
  "productName": "Rice",
  "productType": "grain",
  "productCategory": "organic",
  "pricePerUnit": 50,

  // Optional fields
  "sampleDetails": {
    "quantity": "5 kg",
    "address": "Delivery address",
    "notes": "Special requirements"
  },
  "buyerNotes": "Additional message"
}
```

**Response Structure:**

```json
{
  "interactionType": "shortlist | express_interest | request_sample",
  "farmerid": "FID001",
  "buyerid": "BID001",
  "farmer": {
    "farmerId": "FID001",
    "email": "farmer@example.com",
    "contactPerson": "John Doe",
    "companyName": "Farm Co.",
    "phoneNumber": "+91...",
    "address": "...",
    "mapLocation": { "lat": 0, "lng": 0 }
  },
  "buyer": {
    "buyerId": "BID001",
    "email": "buyer@example.com",
    "fullName": "Jane Smith",
    "companyName": "Buyer Corp",
    "phoneNumber": "+91..."
  },
  "product": {
    "productId": "3",
    "productName": "Rice",
    "type": "grain",
    "category": "organic",
    "pricePerUnit": 50
  },
  "status": "pending",
  "sampleDetails": { ... },
  "buyerNotes": "...",
  "farmerResponse": "",
  "createdAt": "2026-01-08T...",
  "updatedAt": "2026-01-08T...",
  "respondedAt": null
}
```

**GET `/api/interactions`**

Retrieve interactions filtered by user.

**Query Parameters:**

- `userId` (required): The farmer ID (FID001) or buyer ID (BID001)
- `userType` (required): Either "farmer" or "buyer"
- `interactionType` (optional): Filter by "shortlist", "express_interest", or "request_sample"
- `status` (optional): Filter by "pending", "accepted", "rejected", or "completed"

**Examples:**

```bash
# Get all interactions for a farmer
GET /api/interactions?userId=FID001&userType=farmer

# Get all interactions for a buyer
GET /api/interactions?userId=BID001&userType=buyer

# Filter by interaction type
GET /api/interactions?userId=FID001&userType=farmer&interactionType=express_interest

# Filter by status
GET /api/interactions?userId=BID001&userType=buyer&status=pending

# Combine filters
GET /api/interactions?userId=FID001&userType=farmer&interactionType=shortlist&status=pending
```

**PUT `/api/interactions`**

Update an interaction's status and farmer response.

**Request Body:**

```json
{
  "interactionId": "MongoDB ObjectId",
  "status": "accepted | rejected | completed",
  "farmerResponse": "Response message from farmer"
}
```

**DELETE `/api/interactions`**

Delete an interaction by ID.

**Request Body:**

```json
{
  "interactionId": "MongoDB ObjectId"
}
```

### Database Collections

**interactions** - Stores buyer-farmer interactions

- Top-level fields: `farmerid`, `buyerid` for efficient querying
- Nested objects: `farmer`, `buyer`, `product` for complete details
- Status tracking: `status`, `createdAt`, `updatedAt`, `respondedAt`
- Prevents duplicates: Same farmer-buyer-product-interactionType combination
