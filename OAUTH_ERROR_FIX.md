# Google OAuth Error Fix Guide

## The Error Explained
The **500 Server Error** you're seeing is typically caused by:
1. **Incorrect Client ID configuration**
2. **Missing authorized domains in Google Cloud Console**
3. **API not enabled**
4. **Wrong redirect URIs**

## Step-by-Step Fix

### 1. Fix Environment Variable
✅ **COMPLETED**: Updated `env.local` to use correct Next.js format:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here
```

### 2. Google Cloud Console Setup

#### A. Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project (or create a new one)

#### B. Enable Required APIs
1. Go to "APIs & Services" > "Library"
2. Search and enable these APIs:
   - **Google+ API** (if available)
   - **Google Identity** 
   - **People API**

#### C. Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: "ClariMeet"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Add test users if needed

#### D. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. **CRITICAL**: Add these to "Authorized JavaScript origins":
   ```
   http://localhost:3000
   http://127.0.0.1:3000
   ```
5. **CRITICAL**: Add these to "Authorized redirect URIs":
   ```
   http://localhost:3000
   http://localhost:3000/auth/callback
   ```

### 3. Update Your Client ID
1. Copy your new Client ID from the credentials page
2. Replace in `env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-new-client-id-here
   ```

### 4. Restart Development Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### 5. Test the Integration
1. Go to http://localhost:3000
2. Click the "Sign In" button
3. Complete the OAuth flow

## Common Issues & Solutions

### Issue: "Invalid client" error
**Solution**: Check that your Client ID is correct and the domain is authorized

### Issue: "Access blocked" error  
**Solution**: 
1. Enable required APIs
2. Configure OAuth consent screen
3. Add your domain to authorized origins

### Issue: "Redirect URI mismatch" error
**Solution**: Add your exact domain to authorized redirect URIs

### Issue: Button doesn't appear
**Solution**: Check browser console for JavaScript errors

## Verification Checklist
- [ ] Environment variable uses `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] Google Cloud Console project is active
- [ ] Required APIs are enabled
- [ ] OAuth consent screen is configured
- [ ] Authorized JavaScript origins include `http://localhost:3000`
- [ ] Authorized redirect URIs include `http://localhost:3000`
- [ ] Client ID is correctly copied to env.local
- [ ] Development server is restarted

## Production Setup
For production deployment:
1. Add your production domain to authorized origins:
   ```
   https://yourdomain.com
   ```
2. Add production redirect URIs:
   ```
   https://yourdomain.com
   https://yourdomain.com/auth/callback
   ```
3. Update environment variables in your hosting platform

## Need Help?
If you're still getting errors:
1. Check browser console for detailed error messages
2. Verify all steps in this guide are completed
3. Try creating a fresh OAuth client in Google Cloud Console
4. Ensure your Google Cloud project billing is enabled
