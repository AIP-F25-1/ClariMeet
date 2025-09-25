# Google Authentication Setup Guide

## Prerequisites
1. A Google account
2. Access to Google Cloud Console

## Step-by-Step Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable Google+ API
1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity" if available

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add your domain to "Authorized JavaScript origins":
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
5. Add redirect URIs if needed
6. Click "Create"

### 4. Configure Environment Variables
1. Copy your Client ID from the credentials page
2. Create a `.env.local` file in your project root
3. Add the following line:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-client-id-here
   ```
4. Replace `your-actual-client-id-here` with your actual Google Client ID

### 5. Test the Integration
1. Start your development server: `npm run dev`
2. Navigate to your application
3. Click the "Sign in with Google" button
4. Complete the OAuth flow
5. Verify that user information is displayed correctly

## Security Notes
- Never commit your `.env.local` file to version control
- Use different Client IDs for development and production
- Regularly rotate your OAuth credentials
- Monitor your OAuth usage in Google Cloud Console

## Troubleshooting
- **"Invalid client" error**: Check that your Client ID is correct
- **"Origin mismatch" error**: Ensure your domain is added to authorized origins
- **"Access blocked" error**: Check that the Google+ API is enabled
- **Button not appearing**: Check browser console for JavaScript errors

## Features Included
- ✅ Google Sign-In button with official styling
- ✅ User profile display with avatar and name
- ✅ Persistent login state (localStorage)
- ✅ Sign-out functionality
- ✅ Responsive design matching your theme
- ✅ Error handling and loading states
- ✅ TypeScript support

## Customization
You can customize the Google Sign-In button by modifying the `GoogleSignIn` component in `components/ui/google-signin.tsx`. The component supports:
- Custom button text
- Custom styling classes
- Success and error callbacks
- Different button themes and sizes
