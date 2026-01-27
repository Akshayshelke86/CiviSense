# 🏙️ CiviSense – Maharashtra Civic Engagement Platform

> *Empowering citizens. Enabling transparency. Building smarter cities for Maharashtra.*

---

## 🚀 Overview
**CiviSense** is a state-of-the-art, full-stack civic reporting platform designed to bridge the communication gap between the **citizens of Maharashtra** and local authorities. 

It enables users to **report municipal issues** (potholes, waste management, broken infrastructure), track resolutions in real-time, and foster **community-driven governance** through transparency and precision.

---

## ✨ Features

### 🧍 For Citizens
- 📍 **Precision Tagging**: Location-based issue reporting using an interactive Leaflet map restricted to Maharashtra boundaries.
- 📸 **Visual Evidence**: Upload multiple issue photos and detailed descriptions for context.
- 🔍 **Live Map View**: Search and view civic reports from nearby areas on a high-performance map grid.
- 🔄 **Real-Time Tracking**: Track grievances through every stage (Submitted → Acknowledged → In Progress → Resolved).

### 🧑‍💼 For Administrators
- 🧾 **Command Center**: Exclusive Admin Dashboard for managing, prioritizing, and assigning issues.
- 🚫 **Smart Quarantine**: Advanced system to filter duplicate or irrelevant reports before they hit the public view.
- 📊 **CSV Export**: Generate data-driven reports for offline state-level analysis.
- 🛡️ **Hardened Auth**: JWT-based login with industry-standard RBAC (Role-Based Access Control).

---

## 🌐 Deployment & Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React.js (Vite) + Vanilla CSS / Tailwind |
| **Icons** | Lucide-React |
| **Maps** | Leaflet.js (Geofenced to MH) |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB (Mongoose) |
| **Security** | Helmet.js + JWT + Express Rate Limit |

---

## ⚙️ Quick Start

### 🔧 Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local instance)

### 🛠️ Setup Instructions
For detailed production setup, see [PRODUCTION.md](./PRODUCTION.md).

1. **Clone the repository**
2. **Setup Backend**:
   ```bash
   cd civicreport-backend
   npm install
   # Create .env based on .env.example
   npm run dev
   ```
3. **Setup Frontend**:
   ```bash
   cd src
   npm install
   npm run dev
   ```

---

## 🔒 Security Highlights
- **Helmet.js Integration**: Protection against XSS, clickjacking, and mime-sniffing.
- **DDoS Prevention**: Express rate-limiting on all API endpoints.
- **Geofencing**: Coordinate-level validation ensures data integrity remains within Maharashtra boundaries.
- **Sanitized Uploads**: Verification of file sizes and types for all visual evidence.

---

## 🌟 Unique Selling Points (USP)
- **State-Focused Infrastructure**: Custom-tailored for the Maharashtra Government digital ecosystem.
- **Premium User Experience**: Designed with modern glassmorphism and motion-first UI.
- **Transparency-First**: Citizens see exactly who is working on their issue and when it was updated.

---

## 🏁 License
This project is released under the **MIT License**.
Feel free to use, modify, and build upon it to improve civic participation!
