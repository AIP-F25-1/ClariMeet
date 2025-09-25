# Fix Google 404 Error - Step by Step

## The Problem
You're getting a Google 404 error, which means Google can't find your OAuth configuration.

## Quick Fix Steps

### Step 1: Create Environment File
Create a file called `.env.local` in your project root folder with this content:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

### Step 2: Get Google Client ID
1. Go to: https://console.cloud.google.com/
2. Click "Create Project" or select existing project
3. Go to "APIs & Services" → "Library"
4. Search for "Google+ API" and enable it
5. Go to "APIs & Services" → "Credentials"
6. Click "Create Credentials" → "OAuth 2.0 Client IDs"
7. Choose "Web application"
8. Add these to "Authorized JavaScript origins":
   ```
   http://localhost:3000
   ```
9. Copy the "Client ID" (looks like: 123456789-abc123.apps.googleusercontent.com)

### Step 3: Update Environment File
Replace `your-google-client-id-here` with your actual Client ID:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
```

### Step 4: Restart Server
```bash
# Stop your server (Ctrl+C)
npm run dev
```

### Step 5: Test
1. Go to http://localhost:3000
2. Look at the debug info box
3. Click "Debug Console" to see detailed info
4. Try the Google Sign-In button

## What to Look For

### ✅ Success Signs:
- Debug box shows "LOADED" for Google Script
- Client ID shows your actual ID (not "NOT SET")
- No 404 errors in browser console

### ❌ Problem Signs:
- Client ID shows "NOT SET"
- Google Script shows "LOADING..." forever
- 404 errors in browser console

## Common Issues

### Issue: "Client ID: NOT SET"
**Fix**: Make sure your `.env.local` file exists and has the correct variable name

### Issue: "Access blocked" error
**Fix**: Add `http://localhost:3000` to authorized origins in Google Cloud Console

### Issue: Still getting 404
**Fix**: 
1. Double-check your Client ID is correct
2. Make sure you restarted the server after creating `.env.local`
3. Check that authorized origins include `http://localhost:3000`

## Need Help?
1. Check the debug info box on your page
2. Click "Debug Console" button
3. Look at browser console for specific errors
4. Verify all steps above are completed

## After It Works
Once Google Sign-In is working, you can remove the debug component from your page.
