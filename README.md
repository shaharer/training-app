# TrainAI — Deployment Guide

## What you need first

- **Node.js** (v18+) — download from [nodejs.org](https://nodejs.org) if you don't have it
- **A GitHub account** — free at [github.com](https://github.com)
- **A Vercel account** — free at [vercel.com](https://vercel.com) (sign in with GitHub)

---

## Step 1: Unzip and test locally (2 min)

```bash
# Unzip the project
unzip training-app.zip
cd training-app

# Install dependencies
npm install

# Run it locally
npm run dev
```

Open **http://localhost:5173** in your browser. You should see the app.

---

## Step 2: Push to GitHub (2 min)

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit - TrainAI"

# Create a repo on GitHub (or use the GitHub CLI):
# Go to github.com → New Repository → name it "training-app" → Create
# Then follow the instructions to push:

git remote add origin https://github.com/YOUR_USERNAME/training-app.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel (1 min)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import"** next to your `training-app` repo
3. Vercel auto-detects Vite — just click **"Deploy"**
4. Wait ~30 seconds. Done!

You'll get a URL like: **`https://training-app-abc123.vercel.app`**

---

## Step 4: Open on your iPhone

1. Open Safari on your iPhone
2. Go to your Vercel URL
3. Tap the **Share** button (square with arrow)
4. Tap **"Add to Home Screen"**
5. Name it "TrainAI" and tap Add

It now looks and feels like a native app on your home screen!

---

## Optional: Custom domain

If you buy a domain (e.g. from Namecheap, ~$10/year):

1. Go to your Vercel project → Settings → Domains
2. Add your domain
3. Update your domain's DNS to point to Vercel (they give you the exact records)

---

## Future updates

Every time you push to `main` on GitHub, Vercel auto-deploys.

```bash
# Make changes, then:
git add .
git commit -m "Updated workout UI"
git push
```

Your live site updates in ~30 seconds.
