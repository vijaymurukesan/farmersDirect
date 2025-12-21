# Email Setup Guide for Farmers Direct

## Using Gmail with Nodemailer

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the steps to enable it

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → Enter "Farmers Direct"
4. Click **Generate**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update .env.local
Add these lines to your `.env.local` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Important:**
- Use the 16-character app password (remove spaces)
- Do NOT use your regular Gmail password
- Never commit `.env.local` to git

### Step 4: Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Start again
pnpm dev --turbopack
```

## Testing
1. Register a new user or login
2. Go to `/verification`
3. Click "Send Verification Email"
4. Check your email inbox
5. Click the verification link

## Alternative Email Providers

### Using Outlook/Hotmail
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```
Update `emailService.ts`:
```typescript
service: 'outlook'
```

### Using Custom SMTP
Update `emailService.ts`:
```typescript
host: 'smtp.example.com',
port: 587,
secure: false,
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASSWORD,
}
```

## Troubleshooting

### "Invalid login" error
- Check 2FA is enabled
- Use App Password, not regular password
- Remove spaces from app password

### "Connection timeout"
- Check firewall settings
- Verify EMAIL_USER and EMAIL_PASSWORD are set
- Restart dev server after adding env vars

### Email not received
- Check spam/junk folder
- Verify sender email in Gmail "Sent" folder
- Check console for error messages

## Production Deployment

For production, consider using:
- **SendGrid**: Free tier 100 emails/day
- **AWS SES**: Pay as you go, very cheap
- **Mailgun**: 5,000 free emails/month

These are more reliable and provide better deliverability than Gmail.
