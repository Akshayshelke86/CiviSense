import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin', { replace: true })
    }
    inputRef.current?.focus()
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const trimmed = String(password || '').trim()
    if (!trimmed) {
      setError('Please enter the admin password.')
      return
    }

    setLoading(true)
    try {
      // For admin shortcut, we use email 'admin' and the provided password
      const res = await login('admin', trimmed)
      if (res.success) {
        navigate('/admin', { replace: true })
        return
      }
      setError(res.message || 'Invalid admin password')
    } catch (err) {
      console.error('Admin login error:', err)
      setError('Network error — unable to contact auth server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-start md:items-center justify-center py-16 md:py-24 px-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold">Administrative Dashboard</h1>
          <p className="text-gray-500 mt-3">Manage and track the status of all reported issues</p>
        </div>

        <div className="mx-auto max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="#111827" opacity="0.9" />
                <path d="M17 8h-1V6a4 4 0 10-8 0v2H7a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1zM9 6a3 3 0 116 0v2H9V6z" fill="#111827" opacity="0.9" />
              </svg>
            </div>

            <h2 className="text-xl font-semibold">Administrative Access</h2>
            <p className="text-center text-gray-500 max-w-[40rem]">
              Enter the admin password to access the management dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 rounded-lg border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  aria-label="Admin password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded" role="alert" aria-live="polite">{error}</div>}

            <div>
              <button
                type="submit"
                className="w-full bg-[#0b1020] text-white px-6 py-3 rounded-lg font-medium disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Accessing…' : 'Access Dashboard'}
              </button>
            </div>

            <div className="text-center pt-4 border-t">
              <Link to="/login" className="text-sm text-indigo-600 font-medium hover:underline">
                Go to standard login page
              </Link>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded mt-4">
              <strong>Tip:</strong> Users with 'admin' role can access the dashboard using their email/password on the main login page.
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
