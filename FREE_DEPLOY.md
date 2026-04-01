# 🆓 Free Deployment Guide (100% Free)

This guide will help you deploy your app completely free using:
- **Frontend**: Vercel (Free forever)
- **Backend**: Render.com (Free tier)

---

## 📋 Step 1: Deploy Backend on Render.com (FREE)

### 1.1 Create Account
1. Go to https://render.com
2. Sign up with GitHub (free)

### 1.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Fill in the details:
   - **Name**: `realtime-editor-backend` (or any name)
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (or `./` if needed)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Select **"Free"**

### 1.3 Add Environment Variable (Optional)
- **Key**: `FRONTEND_URL`
- **Value**: Leave empty for now (we'll update after frontend is deployed)

### 1.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (takes 2-5 minutes)
3. **Copy the URL** (e.g., `https://realtime-editor-backend.onrender.com`)
   - ⚠️ **Important**: Save this URL! You'll need it for the frontend.

### 1.5 Note about Render Free Tier
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds to wake up
- This is normal and free! Just wait a moment on first connection.

---

## 📋 Step 2: Deploy Frontend on Vercel (FREE)

### 2.1 Create Account
1. Go to https://vercel.com
2. Sign up with GitHub (free)

### 2.2 Deploy Project
1. Click **"Add New Project"**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Create React App (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `build` (default)

### 2.3 Add Environment Variable
1. Before deploying, click **"Environment Variables"**
2. Add new variable:
   - **Name**: `REACT_APP_BACKEND_URL`
   - **Value**: Your Render backend URL from Step 1.4
     - Example: `https://realtime-editor-backend.onrender.com`
   - **Environments**: Select all (Production, Preview, Development)
3. Click **"Save"**

### 2.4 Deploy
1. Click **"Deploy"**
2. Wait 1-2 minutes
3. **Copy your Vercel URL** (e.g., `https://your-app.vercel.app`)

---

## 📋 Step 3: Update Backend CORS (Optional but Recommended)

1. Go back to Render.com dashboard
2. Click on your backend service
3. Go to **"Environment"** tab
4. Add/Update environment variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: Your Vercel URL from Step 2.4
5. Click **"Save Changes"**
6. Render will automatically redeploy

---

## ✅ Step 4: Test Your Deployment

1. Visit your Vercel frontend URL
2. Create a new room
3. Open the same room in another browser/incognito window
4. Type in the editor - changes should sync in real-time!

---

## 🎉 You're Done!

Your app is now live and completely free!

### Your URLs:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

---

## 🔧 Troubleshooting

### Connection Issues?
1. Make sure `REACT_APP_BACKEND_URL` is set in Vercel
2. Check that backend URL has no trailing slash
3. Wait 30 seconds on first connection (Render free tier wake-up)

### Build Errors?
1. Check Vercel build logs
2. Make sure all dependencies are in `package.json`
3. Verify `vercel.json` exists in root

### CORS Errors?
1. Update `FRONTEND_URL` in Render environment variables
2. Redeploy backend after updating

### Backend Not Responding?
- Render free tier spins down after 15 min inactivity
- First request takes ~30 seconds to wake up
- This is normal! Just wait a moment

---

## 💡 Tips

- **Render Free Tier**: Service sleeps after 15 min, wakes on first request
- **Vercel**: Always on, unlimited deployments
- Both services are free forever for personal projects
- No credit card required!

---

## 📝 Summary

✅ Frontend on Vercel (always free)  
✅ Backend on Render (free tier)  
✅ Real-time WebSocket support  
✅ No cost, no credit card needed!

Enjoy your free deployment! 🚀

