# Vercel Blob Storage Setup Guide

## What is Vercel Blob?
Vercel Blob is a cloud storage service that stores files (documents, images, videos) on Vercel's infrastructure with global CDN support.

## Setup Steps

### 1. Create a Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub, GitLab, or email
3. It's free for hobby projects!

### 2. Create a Blob Store

#### Option A: Via Vercel Dashboard (Recommended)
1. Go to [vercel.com/dashboard/stores](https://vercel.com/dashboard/stores)
2. Click **"Create Database"** or **"Create Store"**
3. Select **"Blob"**
4. Give it a name (e.g., `farmers-direct-documents`)
5. Click **"Create"**
6. Copy the **`BLOB_READ_WRITE_TOKEN`** that appears

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Create Blob store
vercel blob create farmers-direct-documents
```

### 3. Add Token to Environment Variables

1. Open `.env.local` file in your project root
2. Replace `your-vercel-blob-token-here` with your actual token:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxx
```

### 4. Deploy to Vercel (Production)

When deploying to Vercel:

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. In Vercel Dashboard → Project Settings → Environment Variables
4. Add `BLOB_READ_WRITE_TOKEN` with your token value
5. Redeploy

## How It Works in Your App

### Upload Flow:
1. User selects documents on `/verification` page
2. Click "Submit Documents"
3. Files are uploaded to Vercel Blob Storage
4. Vercel Blob returns secure URLs (e.g., `https://xyz.public.blob.vercel-storage.com/...`)
5. URLs are saved to MongoDB (not the actual files)

### Download Flow (Admin):
1. Admin goes to `/admin` → "Pending Access" tab
2. Clicks "Show Docs" on a user
3. Clicks "Download" button
4. File is downloaded directly from Vercel Blob Storage

## Free Tier Limits
- **Storage**: 500 MB
- **Bandwidth**: 1 GB/month
- **Perfect for**: Academic projects, demos

## File Storage Structure
```
verification-docs/
  ├── FID001/
  │   ├── FID001_aadhaar_1234567890_aadhar.pdf
  │   ├── FID001_land_registration_1234567891_land_doc.pdf
  │   └── FID001_land_records_1234567892_records.pdf
  └── FID002/
      └── ...
```

## Supported File Types
- PDF documents (`.pdf`)
- Images (`.jpg`, `.jpeg`, `.png`, `.webp`)
- Word documents (`.doc`, `.docx`)

## Maximum File Size
- **10 MB per file** (configurable in `/api/upload-document/route.ts`)

## Security Features
- ✅ JWT authentication required
- ✅ File type validation
- ✅ File size limits
- ✅ Unique filenames (prevents overwrites)
- ✅ Organized by farmer ID

## Troubleshooting

### Error: "Missing BLOB_READ_WRITE_TOKEN"
- Make sure `.env.local` has the token
- Restart your dev server after adding the token

### Error: "Failed to upload file"
- Check if your token is correct
- Verify you have internet connection
- Check Vercel Blob dashboard for quota limits

### Files not downloading in admin panel
- Verify the `fileUrl` is stored correctly in MongoDB
- Check browser console for CORS errors
- Ensure the Blob URL is publicly accessible

## Testing Locally

1. Set up your token in `.env.local`
2. Restart dev server: `npm run dev`
3. Register as farmer and go to `/verification`
4. Upload test documents
5. Check admin panel → Pending Access

## Production Deployment Checklist

- [ ] Vercel Blob store created
- [ ] `BLOB_READ_WRITE_TOKEN` added to Vercel environment variables
- [ ] Code pushed to GitHub
- [ ] Project connected to Vercel
- [ ] Deployment successful
- [ ] Test document upload in production
- [ ] Test document download in admin panel

## Cost Estimate

For 100 farmers × 3 documents × 500KB each:
- Storage: 150 MB (FREE - well within 500 MB limit)
- Bandwidth: ~1 GB/month (FREE - exactly at limit)
- **Total Cost: $0/month** ✅

## Alternative: Cloudinary (if you prefer)

If you want more free storage (25 GB vs 500 MB), you can switch to Cloudinary:

```bash
npm install cloudinary
```

See `CLOUDINARY_SETUP.md` for instructions.

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs/storage/vercel-blob
- Support: https://vercel.com/support
