# Quick Test Guide - Contract PDF Email Feature

## ✅ Feature Status: READY TO USE

The automatic email sending feature is **already implemented and working**. When you approve a payment, both the farmer and buyer will automatically receive an email with the contract PDF attached.

## 🚀 Quick Test (5 minutes)

### Step 1: Verify Email Configuration

Check your `.env.local` file has these settings:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

💡 **Important:** Use Gmail App Password, NOT your regular Gmail password

- Go to: https://myaccount.google.com/apppasswords
- Generate new app password
- Use that 16-character password

### Step 2: Restart Your Server

```bash
# Stop current server (Ctrl+C)
pnpm dev
```

### Step 3: Test the Flow

#### Option A: Use Existing Payment

1. Login as **Admin** at `http://localhost:3000/admin`
2. Find an interaction with pending payment
3. Click **"Approve Payment"** button
4. Watch console for success message:
   ```
   ✅ Contract PDF generated and emailed to both parties successfully
      - Farmer: farmer@example.com
      - Buyer: buyer@example.com
   ```

#### Option B: Create New Payment Flow

1. **Login as Buyer** → Navigate to any product
2. **Submit Payment** with screenshot
3. **Login as Admin** → Find the pending payment
4. **Approve Payment** → Emails sent automatically

### Step 4: Check Email Inboxes

Both farmer and buyer should receive:

- **Subject:** 📋 Contract Agreement - [Product Name]
- **Attachment:** Contract PDF (complete legal document)
- **Content:** Professional email with next steps

## 🔍 What to Verify in Email

### Farmer's Email Should Include:

✅ Payment verified confirmation  
✅ Product and buyer details  
✅ Next steps for delivery  
✅ Contract PDF attachment  
✅ Link to dashboard

### Buyer's Email Should Include:

✅ Payment confirmation  
✅ Product and seller details  
✅ Next steps for coordination  
✅ Contract PDF attachment  
✅ Link to dashboard

### Contract PDF Should Include:

✅ Payment screenshot embedded  
✅ All 12 legal clauses  
✅ Both party signatures  
✅ Company authorization (Vijay Murukesan)  
✅ Payment breakdown (10%/90%)  
✅ Transaction ID and date

## 📊 Console Messages to Watch

### Success:

```bash
✅ Contract PDF generated and emailed to both parties successfully
   - Farmer: farmer@example.com
   - Buyer: buyer@example.com
Payment approved for interaction: 6960b7a54fb3f6aadbdcb608 - Status updated to awaiting-delivery
```

### If Email Fails (Still Success):

```bash
⚠️ Failed to send contract PDF emails: [error message]
   Payment approval will still proceed, but emails were not sent
Payment approved for interaction: 6960b7a54fb3f6aadbdcb608 - Status updated to awaiting-delivery
```

## 🐛 Common Issues & Quick Fixes

### Issue 1: "Failed to send contract PDF emails"

**Cause:** Wrong email credentials  
**Fix:**

1. Use Gmail App Password (not regular password)
2. Check EMAIL_USER and EMAIL_PASSWORD in `.env.local`
3. Restart server after changing `.env.local`

### Issue 2: Emails Not Received

**Cause:** Gmail blocking or wrong recipient email  
**Fix:**

1. Check spam/junk folder
2. Verify farmer/buyer email in MongoDB is correct
3. Try sending test email from your Gmail account manually

### Issue 3: PDF Not Attached

**Cause:** PDF generation failed  
**Fix:** Check console for PDF generation errors

## 🎯 Expected Results

After clicking "Approve Payment":

1. ✅ Payment status changes to "verified"
2. ✅ Interaction status changes to "awaiting-delivery"
3. ✅ Console shows email success message
4. ✅ Farmer receives email with PDF
5. ✅ Buyer receives email with PDF
6. ✅ Both can download contract from dashboard

## 📁 Files Involved

1. **Email Trigger:** `/src/app/api/interactions/route.ts` (lines 440-489)
2. **Email Service:** `/src/app/lib/emailService.ts` (lines 1469-1829)
3. **PDF Generator:** `/src/app/lib/contractPdfGenerator.ts` (670+ lines)
4. **Environment:** `.env.local` (email credentials)

## 🔗 Next Steps After Successful Test

✅ **Email feature is working** - No code changes needed  
✅ **Update production .env** - Add real Gmail credentials  
✅ **Test with real email addresses** - Verify farmer/buyer receive emails  
✅ **Monitor console logs** - Check for any errors

## 💡 Pro Tips

1. **Gmail Daily Limit:** Free Gmail accounts can send ~500 emails/day
2. **Spam Prevention:** Don't send too many test emails rapidly
3. **Production:** Consider using SendGrid/AWS SES for production
4. **Logging:** All email attempts are logged in console

---

## Need Help?

If emails aren't sending:

1. Check `.env.local` has correct EMAIL_USER and EMAIL_PASSWORD
2. Verify using Gmail App Password (16 characters)
3. Restart development server
4. Check console for error messages
5. Verify recipient emails are valid in MongoDB

**The feature is ready - just configure your email and test!** 🎉
