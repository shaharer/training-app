# TrainAI — Setup & Deployment Guide

## Overview

TrainAI is a multi-user workout logging app with:
- **Google sign-in** (each user gets their own private data)
- **Real QR code scanning** (camera-based, on your phone)
- **Cloud storage** (Firebase Firestore — your workouts persist across devices)
- **Free hosting** (Vercel)

---

## Step 1: Create a Firebase Project (5 min)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Create a project"** (or "Add project")
3. Name it `trainai` → Continue
4. Disable Google Analytics (not needed) → Create Project
5. Wait for it to finish → Continue

### Enable Google Authentication

1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Click **"Google"** in the sign-in providers list
4. Toggle **Enable** on
5. Select your email as the project support email
6. Click **Save**

### Create Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Pick a location close to you (e.g., `us-west1` for the US West Coast)
5. Click **Enable**

### Set Security Rules

1. In Firestore, click the **"Rules"** tab
2. Replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **Publish**

This ensures each user can only access their own data.

### Get Your Firebase Config

1. Click the **gear icon** (⚙️) next to "Project Overview" → **Project settings**
2. Scroll down to **"Your apps"** → click the **Web icon** (`</>`)
3. Register the app — name it `trainai-web` → click **Register app**
4. You'll see a config object like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "trainai-xxxxx.firebaseapp.com",
  projectId: "trainai-xxxxx",
  storageBucket: "trainai-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

5. **Copy these values** — you'll need them in the next step.

---

## Step 2: Configure the App (2 min)

1. In your project folder, **copy** `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Open `.env` and fill in your Firebase values:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=trainai-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=trainai-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=trainai-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## Step 3: Test Locally (2 min)

```bash
npm install
npm run dev
```

Open **http://localhost:5173** — you should see the login screen. Sign in with Google, and start logging workouts. Check your Firebase console → Firestore → Data to see entries appearing.

---

## Step 4: Deploy to Vercel (3 min)

### Push to GitHub

```bash
git init
git add .
git commit -m "TrainAI v2 - multi-user with Firebase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/trainai.git
git push -u origin main
```

### Deploy

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `trainai` repo
3. **Before clicking Deploy**, expand **"Environment Variables"**
4. Add each variable from your `.env` file:
   - `VITE_FIREBASE_API_KEY` → your value
   - `VITE_FIREBASE_AUTH_DOMAIN` → your value
   - `VITE_FIREBASE_PROJECT_ID` → your value
   - `VITE_FIREBASE_STORAGE_BUCKET` → your value
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` → your value
   - `VITE_FIREBASE_APP_ID` → your value
5. Click **Deploy**

### Add Your Vercel URL to Firebase

After deployment, Vercel gives you a URL like `https://trainai-abc123.vercel.app`.

1. Go back to Firebase Console → **Authentication** → **Settings** tab
2. Under **"Authorized domains"**, click **Add domain**
3. Add your Vercel URL domain: `trainai-abc123.vercel.app`
4. If you add a custom domain later, add that too

---

## Step 5: Open on iPhone

1. Open Safari → go to your Vercel URL
2. Sign in with Google
3. Tap **Share** → **"Add to Home Screen"**
4. Now it's on your home screen like a native app

---

## How QR Codes Work

The app scans QR codes that contain exercise data in this JSON format:

```json
{"name": "Chest Press", "muscle": "Chest", "machineId": "CP-01"}
```

To create QR codes for your gym:
1. Open the app → **Log** tab → tap **QR Code Scan**
2. Tap **"Generate Test QR Codes"** at the bottom
3. These generate real scannable QR codes you can print and stick on machines

Or use any QR code generator website to create codes with the JSON format above.

---

## Data Privacy

- Each user signs in with their own Google account
- Firestore security rules ensure users can **only see their own data**
- No user can read another user's workouts, plan, or saved videos
- The Firebase API key is safe to expose — security is enforced by Firestore rules, not the API key

---

## Future Updates

Every `git push` to `main` triggers an auto-deploy on Vercel:

```bash
git add .
git commit -m "Added new feature"
git push
```

Live in ~30 seconds.
