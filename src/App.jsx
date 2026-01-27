import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Shell from './layouts/Shell'
import ErrorBoundary from './components/ErrorBoundary'

// Pages
import Home from './pages/Home'
import ReportPage from './pages/ReportPage'
import MapView from './pages/MapView'
import MapTest from './pages/MapTest'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Shell>
      <ErrorBoundary>
        <Routes>
          {/* Single canonical homepage */}
          <Route path="/" element={<Home />} />

          {/* Reporting page */}
          <Route path="/report" element={<ReportPage />} />

          {/* Map views */}
          <Route path="/map" element={<MapView />} />
          <Route path="/maptest" element={<MapTest />} />

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin pages */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </Shell>
  )
}
