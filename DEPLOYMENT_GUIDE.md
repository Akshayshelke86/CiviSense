# 🚀 CiviSense Deployment Guide (Netlify & Vercel)

Deploying **CiviSense** is a two-part process. Because our platform uses **Real-time WebSockets (Socket.io)** and **File Uploads**, the Frontend and Backend must be hosted separately.

---

## 🏗️ Part 1: Deploying the Backend (API)
**Recommended Host:** [Render.com](https://render.com) (FREE) or [Railway.app](https://railway.app).
*Note: Netlify and Vercel are "Serverless" and do not support the persistent connections required by our Map's real-time features.*

### Steps for Render:
1. Create a new **Web Service**.
2. Connect your GitHub repository.
3. Root Directory: `civicreport-backend`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. **Environment Variables**: Add all variables from `civicreport-backend/.env.example`.
   - `JWT_SECRET`: (Random long string)
   - `MONGO_URI`: (Your MongoDB Atlas connection string)
   - `CORS_ORIGIN`: `https://your-civisense.netlify.app` (The URL your frontend will get).

---

## 💻 Part 2: Deploying the Frontend (UI)
**Recommended Host:** [Netlify](https://netlify.com) or [Vercel](https://vercel.com).

### Option A: Netlify (Easiest)
1. Log in to [Netlify](https://app.netlify.com).
2. Click **"Add new site"** -> **"Import from Git"** or **"Deploy manually"**.
3. If using Git:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
4. **Environment Variables**:
   - `VITE_API_BASE`: `https://your-backend-url.onrender.com` (Get this from Part 1).
5. The `public/_redirects` file I added will automatically handle routing.

### Option B: Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New"** -> **"Project"** and connect your Repo.
3. Framework Preset: **Vite**.
4. Root Directory: `./` (or leave empty if project is at root).
5. **Environment Variables**:
   - `VITE_API_BASE`: `https://your-backend-url.onrender.com`.
6. The `vercel.json` file I added will handle routing.

---

## 🛠️ Essential Final Checklist
1. **MongoDB**: Ensure your [MongoDB Atlas](https://mongodb.com) Network Access is set to **"Allow Access from Anywhere"** (IP 0.0.0.0) so Render can connect.
2. **CORS**: Once your Netlify site is live, copy its URL and paste it into the `CORS_ORIGIN` variable on your Backend (Render/Railway).
3. **Build**: I have already performed a local production build to verify the system works.

**CiviSense is ready for the world!** 🌍🏙️
