# Google Sign-In Button Troubleshooting Guide

## Quick Fix Steps

### 1. Create Environment File
Create a `.env.local` file in your project root with:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-google-client-id-here
```

### 2. Get Your Google Client ID
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Identity
4. Go to "APIs & Services" > "Credentials"
5. Create OAuth 2.0 Client ID
6. Add authorized origins: `http://localhost:3000`
7. Copy the Client ID

### 3. Update Environment File
Replace `your-actual-google-client-id-here` with your real Client ID

### 4. Restart Development Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

## Common Issues & Solutions

### Issue: "Google Client ID not configured"
**Solution**: Make sure your `.env.local` file exists and has the correct variable name

### Issue: "Google Identity Services not loaded"
**Solution**: 
- Check your internet connection
- Wait a few seconds and try again
- Check browser console for errors

### Issue: Button doesn't respond when clicked
**Solution**:
- Check browser console for errors
- Verify the Google Client ID is correct
- Make sure authorized origins include `http://localhost:3000`

### Issue: "Access blocked" error
**Solution**:
- Add `http://localhost:3000` to authorized JavaScript origins in Google Cloud Console
- Enable required APIs (Google+ API, Google Identity)

## Testing Steps

1. **Check Console**: Open browser dev tools and look for errors
2. **Verify Environment**: Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is loaded
3. **Test Button**: Click the sign-in button and check for popup
4. **Check Network**: Look for failed requests in Network tab

## Fallback Options

If the popup doesn't work, the button will automatically redirect to Google OAuth page as a fallback.

## Need Help?

1. Check browser console for specific error messages
2. Verify all steps in this guide are completed
3. Try creating a fresh OAuth client in Google Cloud Console
4. Ensure your Google Cloud project billing is enabled
