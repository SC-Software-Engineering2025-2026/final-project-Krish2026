# 🚀 Quick Start Guide - Sfera

## What's Been Set Up

Your project now has **two ways to run**:

### Option 1: Full Stack with Local Emulators (Recommended for Development)

```bash
npm start
```

This command starts:

- ✅ **Frontend** on http://localhost:3000 (Vite dev server)
- ✅ **Firebase Emulators** (Authentication, Firestore, Storage)
  - Emulator UI: http://localhost:4000
  - Auth Emulator: http://localhost:9099
  - Firestore Emulator: http://localhost:8080
  - Storage Emulator: http://localhost:9199

**Benefits:**

- Test without using production Firebase
- Data persists between sessions (saved in `firebase-data/`)
- Free development - no Firebase costs
- Reset data anytime by deleting `firebase-data/` folder

### Option 2: Frontend Only (if you have production Firebase set up)

```bash
npm run dev
```

This only starts the Vite dev server at http://localhost:3000

---

## 🔥 Firebase Emulator Features

When you run `npm start`, the Firebase emulators provide:

1. **Emulator UI** (http://localhost:4000)
   - View all data in Firestore
   - See authenticated users
   - Inspect storage files
   - Monitor real-time changes

2. **Authentication Emulator**
   - Create test users without email verification
   - All auth methods work locally

3. **Firestore Emulator**
   - Full database locally
   - Test security rules
   - No cloud costs

4. **Storage Emulator**
   - Upload/download files locally
   - Test file upload features

---

## 📝 Other Available Scripts

```bash
# Run emulators only (without frontend)
npm run emulators

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## ⚙️ Configuration Files Created

- **firebase.json** - Emulator configuration
- **firestore.rules** - Database security rules
- **storage.rules** - File storage security rules
- **firestore.indexes.json** - Database indexes
- **.firebaserc** - Firebase project settings

---

## 🎯 Next Steps

1. **Run the project:**

   ```bash
   npm start
   ```

2. **Open in browser:**
   - Main app: http://localhost:3000
   - Firebase UI: http://localhost:4000

3. **Create a test account:**
   - Go to http://localhost:3000/signup
   - Sign up with any email (no verification needed in emulators)
   - Start exploring!

4. **View data in Emulator UI:**
   - Open http://localhost:4000
   - Check the Firestore tab to see your user data
   - Monitor authentication in the Auth tab

---

## 🔄 Switching to Production Firebase

When you're ready to deploy:

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication, Firestore, and Storage
3. Copy your Firebase config
4. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
5. Add your Firebase credentials to `.env`
6. The app will automatically use production Firebase in production builds

---

## 💡 Tips

- Emulator data is saved in `firebase-data/` folder
- Delete `firebase-data/` to reset all test data
- Press `Ctrl+C` in terminal to stop both servers
- Emulators run independently - you can test backend without frontend

Enjoy building Sfera! 🎉
