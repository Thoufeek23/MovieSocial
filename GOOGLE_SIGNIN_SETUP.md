# Google Sign In Setup Guide

This guide will walk you through setting up Google Sign In for your MovieSocial application.

## Overview

Your authentication system has been updated to support Google Sign In alongside the existing email/password authentication. Users can now choose to sign in using their Google account instead of creating a password.

## Changes Made

### Backend Changes

1. **User Model** ([server/models/User.js](server/models/User.js))
   - Added `googleId` field to store Google OAuth ID
   - Added `authProvider` field to track authentication method ('local' or 'google')
   - Made `passwordHash` optional (not required for Google users)
   - Updated `matchPassword` method to handle Google users
   - Updated password hashing to skip for Google users

2. **Auth Controller** ([server/controllers/authController.js](server/controllers/authController.js))
   - Added `googleAuth` function to handle Google OAuth authentication
   - Automatically creates new users or logs in existing users
   - Generates unique usernames for new Google users
   - Awards new user badge for first-time Google sign-ups

3. **Auth Routes** ([server/routes/auth.js](server/routes/auth.js))
   - Added `POST /api/auth/google` route for Google authentication

### Frontend Changes

1. **API** ([frontend/src/api/index.js](frontend/src/api/index.js))
   - Added `googleAuth` API call

2. **Login Page** ([frontend/app/login.jsx](frontend/app/login.jsx))
   - Added Google Sign In button
   - Integrated Google OAuth flow
   - Added divider between traditional login and Google Sign In

3. **Signup Page** ([frontend/app/signup.jsx](frontend/app/signup.jsx))
   - Added Google Sign In button
   - Integrated Google OAuth flow
   - Added divider between traditional signup and Google Sign In

## Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

### Step 2: Create OAuth Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Configure the OAuth consent screen if prompted:
   - User Type: External
   - App name: MovieSocial
   - User support email: Your email
   - Developer contact: Your email
4. Create OAuth client IDs for each platform:

#### Web Application (for backend and web client)
- Application type: Web application
- Name: MovieSocial Backend & Web Client
- Authorized JavaScript origins:
  - `http://localhost:3000` (for local development)
  - `https://yourdomain.com` (for production)
- Authorized redirect URIs:
  - `http://localhost:3000` (for local development)
  - `https://yourdomain.com` (for production)
- **Save the Client ID** - you'll need this for both backend and web client

#### Android Application
- Application type: Android
- Name: MovieSocial Android
- Package name: `com.moviesocial.app` (or your actual package name from app.json)
- SHA-1 certificate fingerprint: 
  - For development: Run `expo credentials:manager -p android` and get the fingerprint
  - Or run: `keytool -keystore path/to/keystore -list -v`
- **Save the Client ID**

#### iOS Application
- Application type: iOS
- Name: MovieSocial iOS
- Bundle ID: `com.moviesocial.app` (or your actual bundle ID from app.json)
- **Save the Client ID**

#### Web Application (for Expo)
- Application type: Web application
- Name: MovieSocial Web
- Authorized JavaScript origins: 
  - `https://auth.expo.io`
- Authorized redirect URIs:
  - `https://auth.expo.io/@your-expo-username/your-app-slug`
- **Save the Client ID**

### Step 3: Configure Backend Environment Variables

Add the following to your `server/.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-web-client-id-from-step-2.apps.googleusercontent.com
```

### Step 4: Install Backend Dependencies

```bash
cd server
npm install google-auth-library
```

### Step 5: Configure Frontend Environment Variables

Create or update `frontend/.env` file:

```env
# Google OAuth Client IDs
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

**Note:** The `GOOGLE_CLIENT_ID` and `GOOGLE_WEB_CLIENT_ID` should be the same web application client ID.

### Step 6: Configure Web Client Environment Variables

Create or update `client/.env` file:

```env
# Google OAuth Client ID
REACT_APP_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```8: Update app.json (if needed)

Make sure your `frontend/app.json` includes:

```json
{
  "expo": {
    "scheme": "moviesocial",
    "android": {
      "package": "com.moviesocial.app"
    },
    "ios": {
      "bundleIdentifier": "com.moviesocial.app"
    }
  }
}
```

### Step 9: Test the Integration

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Test on Web Client:**
   ```bash
   cd client
   npm start
   ```
   - Navigate to `http://localhost:3000/login` or `/signup`
   - Click the Google Sign In button
   - Select your Google account
   - Verify you're redirected and logged in

3. **Test on Mobile App:**
   ```bash
   cd frontend
   npm start
   ```
   - Navigate to the login or signup page
   - Click "Continue with Google"
   - Select your Google account
   - **Web Client:** Make sure authorized JavaScript origins include your domain
   - **Mobile App:** Make sure the redirect URI in Google Cloud Console matches exactly: `https://auth.expo.io/@your-username/your-app-slug`

2. **"Invalid token" error**
   - Check that `GOOGLE_CLIENT_ID` in backend matches the web client ID
   - Verify the token is being sent correctly from frontend/client

3. **Button not appearing on web**
   - Check that `REACT_APP_GOOGLE_CLIENT_ID` is set in `client/.env`
   - Verify the Google Sign-In script is loading (check browser console)
   - Restart the development server after adding environment variables

4. **Button not appearing on mobile**
   - Check that all environment variables are set correctly in `frontend/.env`
   - Make sure dependencies are installed
   - Restart the Expo development server

5. **Google Sign In not working on physical device**
   - Ensure you've created OAuth credentials for the specific platform (Android/iOS)
   - Verify the package name/bundle ID matches your app.json
   - For Android, ensure SHA-1 fingerprint is correct

6. **Token expired error**
   - This is normal if the Google authentication flow takes too long
   - User should try again

7. **CORS errors on web client**
   - Make sure your domain is added to Authorized JavaScript origins
   - Check that backend is configured to allow requests from your frontend dom

3. **Test Google Sign In:**
   - Navigate to the login or signup page
   - Click "Continue with Google"
   - Select your Google account
   - Verify you're redirected back to the app
   - Check that you're logged in successfully

## Troubleshooting

### Common Issues

1. **"Error 400: redirect_uri_mismatch"**
   - Make sure the redirect URI in Google Cloud Console matches exactly
   - For Expo: `https://auth.expo.io/@your-username/your-app-slug`

2. **"Invalid token" error**
   - Check that `GOOGLE_CLIENT_ID` in backend matches the web client ID
   - Verify the token is being sent correctly from frontend

3. **Button not appearing**
   - Check that all environment variables are set correctly
   - Make sure dependencies are installed
   - Restart the Expo development server

4. **Google Sign In not working on physical device**
   - Ensure you've created OAuth credentials for the specific platform (Android/iOS)
   - Verify the package name/bundle ID matches your app.json
   - For Android, ensure SHA-1 fingerprint is correct

5. **Token expired error**
   - This is normal if the Google authentication flow takes too long
   - User should try again

## User Experience

### For New Users
- Click "Continue with Google" on signup page
- Select Google account
- Automatically creates account with:
  - Username generated from Google name/email
  - Email from Google account
  - Profile picture from Google account
  - No password (Google authentication only)

### For Existing Users
- If email exists in database, user is logged in
- If user previously used email/password, Google ID is linked to existing account
- Can use either Google Sign In or email/password thereafter

## Security Notes

1. **Google ID is stored securely** in the database and linked to user accounts
2. **No passwords are stored** for Google-authenticated users
3. **ID tokens are verified** on the backend using Google's official library
4. **Users with Google accounts cannot use password reset** (they don't have passwords)

## Migration from OTP System

The old OTP-based verification system is still in place and functional. Users can choose to:
- Use the traditional email/password signup with OTP verification
- Use Google Sign In for instant account creation

You can remove the OTP system entirely if you want only Google Sign In by:
1. Removing OTP-related routes from `server/routes/auth.js`
2. Removing OTP-related functions from `server/controllers/authController.js`
3. Removing the OTP input step from `frontend/app/signup.jsx`
4. Removing the `SignupIntent` model from your database

## Next Steps

1. **Test thoroughly** on all platforms (Web, iOS, Android)
2. **Update privacy policy** to mention Google Sign In
3. **Update terms of service** if needed
4. **Consider adding more OAuth providers** (Facebook, Apple, etc.)
5. **Monitor authentication errors** in backend logs

## Support

If you encounter any issues:
- Check backend logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure Google Cloud Console credentials are configured properly
- Test with different Google accounts

---

**Important:** Never commit your `.env` files to version control. Keep your OAuth client secrets secure.
