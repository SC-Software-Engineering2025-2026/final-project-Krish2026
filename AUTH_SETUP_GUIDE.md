# Authentication Setup Guide

## Why Apple & Phone Auth Aren't Working

Your code is correct, but these authentication methods require additional Firebase Console configuration.

---

## 🍎 Apple Sign-In Setup

### Requirements:

- ✅ Enabled in Firebase Console (you've done this)
- ❌ **Authorized domain** configured
- ❌ Only works on **HTTPS** or approved localhost domains

### Steps to Fix:

1. **Go to Firebase Console**: https://console.firebase.google.com/project/sfera-91b35/authentication/providers

2. **Click on Apple** provider

3. **Add Authorized Domains**:
   - For development: `localhost` should already be there
   - For production: Add your actual domain (e.g., `yourdomain.com`)
4. **Important**: Apple Sign-In popup may be blocked by browser. Allow popups for your site.

### Testing Tip:

- Use **Google Sign-In first** to test - it's simpler
- Apple requires proper OAuth setup and may not work perfectly on localhost

---

## 📱 Phone Number Authentication Setup

### Requirements:

- ✅ Enabled in Firebase Console (you've done this)
- ❌ **Domain must be in authorized domains list**
- ❌ **Test phone numbers** (optional for testing)

### Steps to Fix:

#### 1. Add Authorized Domains

1. Go to Firebase Console: https://console.firebase.google.com/project/sfera-91b35/authentication/settings
2. Scroll to **"Authorized domains"**
3. Make sure these are listed:
   - `localhost`
   - `sfera-91b35.firebaseapp.com`
4. If you're using a custom domain, add it here

#### 2. Add Test Phone Numbers (Optional for Development)

1. Go to: https://console.firebase.google.com/project/sfera-91b35/authentication/providers
2. Click on **Phone** provider
3. Scroll to **"Phone numbers for testing"**
4. Add test numbers with verification codes:
   ```
   +1 650-555-1234 → Code: 123456
   +1 650-555-5678 → Code: 654321
   ```

#### 3. Important Phone Number Format:

Always use **international format**:

- ✅ Correct: `+12345678900` (with country code)
- ❌ Wrong: `234-567-8900`
- ❌ Wrong: `2345678900`

---

## 🧪 Testing the Authentication

### Test Order (Easiest to Hardest):

1. ✅ **Email/Password** - Should work immediately
2. ✅ **Google Sign-In** - Works easily on localhost
3. ⚠️ **Phone Authentication** - Requires proper domain authorization
4. ⚠️ **Apple Sign-In** - Most complex, best tested on deployed site

### Common Errors & Solutions:

#### `auth/unauthorized-domain`

- **Cause**: Your domain isn't in Firebase authorized domains
- **Fix**: Add your domain in Firebase Console → Authentication → Settings → Authorized domains

#### `auth/invalid-phone-number`

- **Cause**: Wrong phone number format
- **Fix**: Use international format: `+1234567890`

#### `auth/popup-closed-by-user`

- **Cause**: User closed the popup window
- **Fix**: This is expected behavior - no action needed

#### reCAPTCHA not appearing

- **Cause**: reCAPTCHA is invisible by default
- **Fix**: This is normal - it verifies in the background

---

## 🚀 Quick Start Commands

```bash
# Start the development server
npm run dev

# Visit in browser
http://localhost:3001
```

---

## 📋 Checklist

- [ ] Firebase Console: Check Apple provider is enabled
- [ ] Firebase Console: Verify authorized domains include `localhost`
- [ ] Firebase Console: Check Phone provider is enabled
- [ ] Firebase Console: Add test phone numbers (optional)
- [ ] Browser: Allow popups for localhost:3001
- [ ] Test Google Sign-In first (simplest)
- [ ] Test Phone with international format (+1234567890)
- [ ] Test Apple (may need deployed site)

---

## 🔗 Useful Links

- **Firebase Console**: https://console.firebase.google.com/project/sfera-91b35
- **Authentication Settings**: https://console.firebase.google.com/project/sfera-91b35/authentication/settings
- **Providers**: https://console.firebase.google.com/project/sfera-91b35/authentication/providers
- **Firebase Auth Documentation**: https://firebase.google.com/docs/auth/web/start

---

## 💡 Pro Tips

1. **Google Sign-In** is the easiest to test and works perfectly on localhost
2. **Phone Auth** requires real phone numbers in production (test numbers for dev)
3. **Apple Sign-In** works best on deployed HTTPS sites
4. Check browser console (`F12`) for detailed error messages
5. Your error messages will now show exactly what's wrong!
