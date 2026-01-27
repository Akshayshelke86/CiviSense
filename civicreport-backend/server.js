const express = require('express')
const multer = require('multer')
const path = require('path')
const cors = require('cors')
const fs = require('fs')
const crypto = require('crypto')
const http = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const User = require('./models/User')
const Report = require('./models/Report')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
})

const PORT = Number(process.env.PORT || 4000)
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`
const JWT_SECRET = process.env.JWT_SECRET || 'jagruk_secret_key_123'

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Required for serving uploaded images
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://server.arcgisonline.com", "http://localhost:*", "*"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://us1.locationiq.com", "http://localhost:*", "*"]
    }
  }
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'too_many_requests', message: 'Too many requests, please try again later.' }
})
app.use('/api/', limiter)

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const BASE_DIR = __dirname
const UPLOADS_DIR = path.join(BASE_DIR, 'uploads')
const DATA_FILE = path.join(BASE_DIR, 'reports.json')

// ensure uploads folder exists
try {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })
} catch (err) {
  console.error('Failed to create uploads dir', err)
  process.exit(1)
}

/* ---------------------
   Helpers & File Upload
   --------------------- */

// safeFloat helper
function safeFloat(v, fallback = null) {
  if (v == null || v === '') return fallback
  const f = parseFloat(v)
  return isNaN(f) ? fallback : f
}

// Multer storage for photos and voice notes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const stem = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_')
    cb(null, `${stem}-${Date.now()}${ext}`)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

/* ---------------------
   Socket.io Connection
   --------------------- */
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

/* ---------------------
   Middleware: Auth
   --------------------- */
const protect = async (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, JWT_SECRET)

      // Handle legacy admin case
      if (decoded.id === 'admin_legacy') {
        req.user = { _id: 'admin_legacy', name: 'Admin', role: 'admin' }
        return next()
      }

      // Check if ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
        return res.status(401).json({ error: 'invalid_token', message: 'Malformed User ID in token' })
      }

      req.user = await User.findById(decoded.id).select('-password')
      if (!req.user) {
        return res.status(401).json({ error: 'not_authorized', message: 'User no longer exists' })
      }
      return next()
    } catch (error) {
      console.error('Auth Error:', error)
      return res.status(401).json({ error: 'not_authorized', message: 'Not authorized, token failed' })
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'not_authorized', message: 'Not authorized, no token' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(401).json({ error: 'not_authorized', message: 'Not authorized as an admin' })
  }
}

// Keep the old requireAuth for backward compatibility if needed, but we'll transition to protect
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'admin123').toString()
async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || ''
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized', message: 'Missing or invalid authorization header' })
  }
  const token = auth.slice(7).trim()

  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    if (decoded.id === 'admin_legacy') {
      req.user = { _id: 'admin_legacy', name: 'Legacy Admin', role: 'admin' }
      return next()
    }

    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ error: 'unauthorized', message: 'Invalid token structure' })
    }

    const user = await User.findById(decoded.id)
    if (user && user.role === 'admin') {
      req.user = user
      next()
    } else {
      res.status(401).json({ error: 'unauthorized', message: 'Not authorized as admin' })
    }
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' })
  }
}

/* ---------------------
   Auth Endpoints
   --------------------- */

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ error: 'user_exists', message: 'User already exists' })
    }
    const user = await User.create({ name, email, password })
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' })

    // Emit event for real-time update (e.g. admin sees new user)
    io.emit('user_joined', { name: user.name, createdAt: user.createdAt })

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    })
  } catch (err) {
    res.status(500).json({ error: 'internal', message: err.message })
  }
})

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    // Support legacy admin login too
    if (email === 'admin' && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ id: 'admin_legacy', role: 'admin' }, JWT_SECRET, { expiresIn: '30d' })
      return res.json({ name: 'Admin', role: 'admin', token })
    }

    const user = await User.findOne({ email })
    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' })

      // Emit event
      io.emit('user_login', { name: user.name })

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      })
    } else {
      res.status(401).json({ error: 'invalid_credentials', message: 'Invalid email or password' })
    }
  } catch (err) {
    res.status(500).json({ error: 'internal', message: err.message })
  }
})

// Get current user
app.get('/api/auth/me', protect, async (req, res) => {
  res.json(req.user)
})

// Legacy admin login (keeping it so frontend doesn't break immediately)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {}
  if (String(password) === ADMIN_PASSWORD) {
    const token = jwt.sign({ id: 'admin_legacy', role: 'admin' }, JWT_SECRET, { expiresIn: '30d' })
    return res.json({ ok: true, token })
  }
  return res.status(401).json({ error: 'invalid_credentials', message: 'Invalid password' })
})
app.post('/api/admin/logout', requireAuth, (req, res) => {
  try {
    // The `validTokens` set is not defined in this file.
    // Assuming `req.adminToken` is set by `requireAuth` or similar,
    // and `validTokens` is a global/module-level set for invalidating tokens.
    // If not, this part needs further context or removal.
    // For now, commenting out the `validTokens` part as it's undefined.
    // const token = req.adminToken
    // if (token && validTokens.has(token)) validTokens.delete(token)
    return res.json({ ok: true })
  } catch (err) {
    console.error('Error in /api/admin/logout', err)
    return res.status(500).json({ error: 'internal', message: 'Logout failed' })
  }
})

/* ---------------------
   Persistence helpers (Mongoose)
   --------------------- */

async function insertReport(report) {
  const r = await Report.create({
    ...report,
    location_lat: safeFloat(report.location_lat),
    location_lng: safeFloat(report.location_lng),
  })

  // Emit event for real-time update
  io.emit('report_created', r)

  return r
}

async function findReportsPublic({ status, type, q, page = 1, limit = 10 } = {}) {
  const filter = { quarantined: { $ne: true } }
  if (status) filter.status = status
  if (type) filter.type = type
  if (q) {
    filter.$or = [
      { description: { $regex: q, $options: 'i' } },
      { type: { $regex: q, $options: 'i' } },
      { address: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
    ]
  }
  const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * Math.max(1, parseInt(limit, 10) || 10)
  const docs = await Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.max(1, parseInt(limit, 10) || 10))

  return docs.map((r) => ({
    id: r._id,
    type: r.type,
    summary: (r.description || '').slice(0, 300),
    photo_url: r.photo_url,
    location_lat: r.location_lat,
    location_lng: r.location_lng,
    address: r.address,
    name: r.name,
    status: r.status,
    created_at: r.createdAt,
  }))
}

async function getReportById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  return await Report.findById(id).populate('created_by', 'name email')
}

async function updateReportById(id, patch = {}) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  const updated = await Report.findByIdAndUpdate(id, patch, { new: true })

  if (updated) {
    // Emit event for real-time update
    io.emit('report_updated', updated)
  }

  return updated
}

async function deleteReportById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  const removed = await Report.findByIdAndDelete(id)

  if (removed) {
    // Emit event for real-time update
    io.emit('report_deleted', id)
  }

  return removed
}

/* ---------------------
   Public endpoints
   --------------------- */

// list public paged reports
app.get('/api/public/reports', async (req, res, next) => {
  try {
    const { status, type, q, page = 1, limit = 10 } = req.query
    const results = await findReportsPublic({ status, type, q, page, limit })
    res.json({ ok: true, page: Number(page), limit: Number(limit), total: results.length, data: results })
  } catch (e) {
    next(e)
  }
})

// create a report (protected - requires login)
app.post('/api/reports', protect, (req, res, next) => {
  upload.fields([{ name: 'photo', maxCount: 5 }, { name: 'voice_note', maxCount: 1 }])(req, res, async (err) => {
    if (err) {
      console.error('Multer error', err)
      return res.status(400).json({ error: 'upload_error', message: err.message })
    }
    try {
      const body = req.body || {}

      // Get the photo URL (use first one if multiple provided)
      let photo = null
      if (req.files && req.files['photo'] && req.files['photo'].length > 0) {
        photo = `${BACKEND_URL}/uploads/${path.basename(req.files['photo'][0].filename)}`
      }

      const reportPayload = {
        type: body.type || 'other',
        description: body.description || '',
        location_lat: safeFloat(body.lat || body.location_lat),
        location_lng: safeFloat(body.lng || body.location_lng),
        contact: body.contact || null,
        name: body.name || null,
        address: body.address || null,
        email: body.email || null,
        photo_url: photo,
      }

      if (req.user && mongoose.Types.ObjectId.isValid(req.user._id)) {
        reportPayload.created_by = req.user._id
      }

      const saved = await insertReport(reportPayload)
      res.status(201).json(saved)
    } catch (e) {
      console.error('CRITICAL: Failed to save report:', e)
      res.status(500).json({ error: 'save_failed', message: e.message })
    }
  })
})

/* ---------------------
   Admin / Protected Endpoints
   --------------------- */

// admin listing (returns raw reports array or DB docs)
app.get('/api/reports', requireAuth, async (req, res, next) => {
  try {
    const { status, type, mine, user, quarantined, q } = req.query
    const filter = {}
    if (quarantined !== undefined) {
      filter.quarantined = quarantined === 'true' || quarantined === true
    }
    if (status) filter.status = status
    if (type) filter.type = type
    if (q) {
      filter.$or = [
        { description: { $regex: q, $options: 'i' } },
        { type: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ]
    }
    if (mine === 'true' && user) {
      filter.created_by = user
    }
    const docs = await Report.find(filter).sort({ createdAt: -1 }).populate('created_by', 'name email')
    return res.json(docs)
  } catch (e) {
    next(e)
  }
})

// get single
app.get('/api/reports/:id', async (req, res, next) => {
  try {
    const report = await getReportById(req.params.id)
    if (!report) return res.status(404).json({ error: 'not_found' })
    res.json(report)
  } catch (e) {
    next(e)
  }
})

// patch
app.patch('/api/reports/:id', requireAuth, async (req, res, next) => {
  try {
    const patch = {}
    const { status, description, type, assigned_department_id, quarantined, quarantine_reason } = req.body
    if (status !== undefined) patch.status = status
    if (description !== undefined) patch.description = description
    if (type !== undefined) patch.type = type
    if (assigned_department_id !== undefined) patch.assigned_department_id = assigned_department_id
    if (quarantined !== undefined) patch.quarantined = quarantined === true || quarantined === 'true'
    if (quarantine_reason !== undefined) patch.quarantine_reason = quarantine_reason
    const updated = await updateReportById(req.params.id, patch)
    if (!updated) return res.status(404).json({ error: 'not_found' })
    res.json(updated)
  } catch (e) {
    next(e)
  }
})

// delete
app.delete('/api/reports/:id', requireAuth, async (req, res, next) => {
  try {
    const removed = await deleteReportById(req.params.id)
    if (!removed) return res.status(404).json({ error: 'not_found' })
    // remove uploaded file if present
    try {
      if (removed.photo_url) {
        // works whether photo_url is absolute URL or relative path
        const filename = path.basename(removed.photo_url)
        const filePath = path.join(UPLOADS_DIR, filename)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      }
    } catch (e) {
      console.warn('Failed to delete uploaded file', e)
    }
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

app.get('/api/health', (req, res) => res.json({ ok: true, now: new Date().toISOString(), mongoose: mongoose.connection.readyState }))

/* Global error handler */
app.use((err, req, res, next) => {
  console.error('Unhandled error', err)
  const payload = { error: 'internal_server_error', message: err.message || 'Server error' }
  if (process.env.NODE_ENV === 'development' && err.stack) payload.stack = err.stack
  res.status(500).json(payload)
})

/* ---------------------
   Startup & DB connection
   --------------------- */
const MONGO_URI = process.env.MONGO_URI

async function start() {
  if (!MONGO_URI) {
    console.error('CRITICAL: MONGO_URI is not set in .env. Mongoose requires a connection string.')
    process.exit(1)
  }

  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB via Mongoose')

    server.listen(PORT, () => {
      console.log(`CivicReport backend running at http://localhost:${PORT}`)
      console.log(`Socket.io is enabled and listening.`)
    })
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message)
    process.exit(1)
  }
}

/* Graceful shutdown */
async function gracefulExit() {
  try {
    await mongoose.connection.close()
    console.log('Closed MongoDB connection')
  } catch (e) {
    // ignore
  }
  process.exit()
}

process.on('SIGINT', gracefulExit)
process.on('SIGTERM', gracefulExit)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION', err)
  gracefulExit()
})
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION', reason)
})

// start server
start().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})
