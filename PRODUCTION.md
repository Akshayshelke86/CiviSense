# Production Deployment Guide: CiviSense

This platform is now optimized and secured for production use. Follow these steps to deploy.

## 1. Backend Deployment (Node.js/Express)

### Recommended Hosting: 
- AWS (Elastic Beanstalk / EC2)
- DigitalOcean (App Platform / Droplet)
- Heroku / Render

### Environment Variables
Create a `.env` file on your server with the following:
```env
PORT=4000
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_very_long_random_string_here
ADMIN_PASSWORD=your_secure_admin_password
BACKEND_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

### Deployment Steps
1. Upload the `civicreport-backend` folder.
2. Run `npm install --production`.
3. Set up a reverse proxy (like Nginx) to handle SSL (HTTPS).
4. Run using a process manager: `pm2 start server.js --name civisense-api`.

---

## 2. Frontend Deployment (React / Vite)

### Recommended Hosting:
- Netlify
- Vercel
- AWS Amplify / S3 + CloudFront

### Environment Variables
Ensure these are set in your build settings:
```env
VITE_API_BASE=https://api.yourdomain.com
VITE_LOCATIONIQ_KEY=your_locationiq_token
```

### Deployment Steps
1. Run `npm run build` locally or in your CI/CD pipeline.
2. Upload the contents of the `dist/` folder to your static hosting provider.
3. Configure **Single Page Application (SPA)** routing (redirect all 404s to `index.html`).

---

## 3. Security Hardening Checklist
- [x] **Helmet.js**: Implemented (Secure headers).
- [x] **Rate Limiting**: Implemented (100 reqs / 15 mins).
- [x] **CORS**: Configured (Origin restricted when ENV set).
- [x] **Input Validation**: Coordinate-level checks implemented in frontend/backend.
- [x] **Error Handling**: Custom `ErrorBoundary` and `NotFound` pages added.
- [ ] **SSL/TLS**: Ensure your domain is using `HTTPS` (Managed by host or Nginx).
- [ ] **Database Backup**: Set up automated backups on MongoDB Atlas.

---

## 4. Maintenance
- **Logs**: Backend logs useful events via console. Use `pm2 logs` to monitor.
- **Uploads**: The `uploads/` dir stores images. If using multiple server instances, consider switching to S3 storage.
