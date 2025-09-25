# Fix Google Sign-In CSP and 404 Errors

## ✅ **What I Fixed:**

### **1. Content Security Policy (CSP) Issues**
- **Problem:** CSP was blocking Google Sign-In scripts and `eval()` functions
- **Solution:** Updated `next.config.mjs` to allow necessary Google domains and scripts

### **2. Google Script Loading**
- **Problem:** Google Identity Services couldn't load due to CSP restrictions
- **Solution:** Added proper CSP headers to allow Google scripts

## 🚀 **Steps to Complete the Fix:**

### **Step 1: Create Environment File**
Create a file called `.env.local` in your project root with:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-google-client-id
```

### **Step 2: Get Google Client ID**
1. Go to: https://console.cloud.google.com/
2. Create/select project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add `http://localhost:3000` to authorized origins
5. Copy the Client ID

### **Step 3: Update Environment File**
Replace `your-actual-google-client-id` with your real Client ID

### **Step 4: Restart Server**
```bash
# Stop server (Ctrl+C)
npm run dev
```

## 🔧 **Technical Details:**

### **CSP Headers Added:**
- `script-src`: Allows Google scripts and eval functions
- `connect-src`: Allows OAuth connections to Google
- `frame-src`: Allows Google authentication frames
- `style-src`: Allows Google fonts and styles

### **Google Domains Allowed:**
- `https://accounts.google.com`
- `https://apis.google.com`
- `https://oauth2.googleapis.com`

## 🧪 **Test the Fix:**

1. **Check DevTools Issues tab** - Should show no CSP errors
2. **Try Google Sign-In button** - Should open Google popup
3. **Complete authentication** - Should redirect back to your app

## ❌ **Still Having Issues?**

### **Check These:**
- [ ] `.env.local` file exists with real Client ID
- [ ] Server restarted after creating `.env.local`
- [ ] Google Cloud Console has correct authorized origins
- [ ] No browser extensions blocking popups

### **Common Errors:**
- **"Access blocked"** → Add `http://localhost:3000` to authorized origins
- **"Invalid client"** → Check Client ID is correct
- **"CSP errors"** → Clear browser cache and restart server

## 🎉 **Expected Result:**
- ✅ No more 404 errors
- ✅ No CSP violations in DevTools
- ✅ Google Sign-In button works
- ✅ User can authenticate and access dashboard

The CSP fix is now in place. Just create the `.env.local` file with your Google Client ID and restart the server!
