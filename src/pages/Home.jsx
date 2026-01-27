// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ReportMap from '../components/ReportMap'
import { fetchReports, absolutePhotoUrl } from '../utils/api'
import { useLanguage } from '../context/LanguageContext'
import { socket } from '../utils/socket'
import {
  PlusSquare,
  Map as MapIcon,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Smartphone,
  Navigation2,
  Heart
} from 'lucide-react'

function SafeThumb({ raw, alt = 'thumbnail', className = '' }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    const resolved = raw ? absolutePhotoUrl(raw) : null
    setSrc(resolved)
  }, [raw])

  const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <rect x="80" y="60" width="80" height="40" rx="8" fill="#e2e8f0"/>
    </svg>
  `)

  return (
    <img
      src={src || placeholder}
      alt={alt}
      className={className || 'w-full h-full object-cover'}
      onError={(e) => { e.currentTarget.src = placeholder }}
    />
  )
}

export default function Home() {
  const { t } = useLanguage()
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchReports()
      .then((data) => {
        if (!mounted) return
        const arr = Array.isArray(data) ? data : (data?.data || data?.reports || [])
        setReports(arr)
      })
      .catch(() => mounted && setError('Unable to load reports'))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const handleNewReport = (newReport) => {
      setReports((prev) => {
        if (!prev) return [newReport];
        if (prev.some(r => r.id === newReport._id || r.id === newReport.id)) return prev;
        return [newReport, ...prev];
      });
    };
    socket.on('report_created', handleNewReport);
    return () => socket.off('report_created', handleNewReport);
  }, []);

  const stats = useMemo(() => {
    if (!Array.isArray(reports)) return { total: 0, resolved: 0, progress: 0, pending: 0 }
    return {
      total: reports.length,
      resolved: reports.filter(r => (r.status || '').toLowerCase().includes('resolv')).length,
      progress: reports.filter(r => (r.status || '').toLowerCase().includes('progress')).length,
      pending: reports.filter(r => ['submitted', 'acknowledged'].includes((r.status || '').toLowerCase())).length
    }
  }, [reports])

  const normalizedReports = useMemo(() => {
    if (!Array.isArray(reports)) return []
    return reports.slice(0, 10).map((r) => ({
      id: r.id ?? r._id,
      lat: Number(r.lat ?? r.location_lat),
      lng: Number(r.lng ?? r.location_lng),
      title: r.title || r.type || r.description?.slice(0, 40) || 'Issue Report',
      status: r.status || 'Submitted',
      date: r.date || r.createdAt || r.created_at,
      photo: r.photo_url || r.photo
    }))
  }, [reports])

  return (
    <div className="space-y-20 pb-20">
      {/* --- HERO SECTION --- */}
      <section className="relative pt-12 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-6 border border-indigo-100 animate-fade-in">
          <ShieldCheck size={14} />
          <span>OFFICIAL CIVIC PLATFORM • GOVT. OF MAHARASHTRA</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent italic">
          Civi<span className="text-indigo-600 not-italic">Sense.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">
          Transform your community with <span className="font-bold text-slate-900">CiviSense</span>.
          Report municipal issues, track resolutions in real-time, and build a better Maharashtra together.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/report" className="w-full sm:w-auto btn btn-primary px-10 py-4 text-base">
            <PlusSquare size={20} />
            Lodge Grievance
          </Link>
          <Link to="/map" className="w-full sm:w-auto btn btn-ghost px-10 py-4 text-base">
            <MapIcon size={20} />
            Live Map
          </Link>
        </div>
      </section>

      {/* --- STATS GRID --- */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 max-w-6xl mx-auto">
        <div className="card p-8 group">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <TrendingUp size={24} />
          </div>
          <div className="text-3xl font-black">{loading ? '...' : stats.total}</div>
          <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-1">Active Issues</div>
        </div>

        <div className="card p-8 group">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
            <CheckCircle2 size={24} />
          </div>
          <div className="text-3xl font-black text-emerald-600">{loading ? '...' : stats.resolved}</div>
          <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-1">Resolved</div>
        </div>

        <div className="card p-8 group">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <Clock size={24} />
          </div>
          <div className="text-3xl font-black text-blue-600">{loading ? '...' : stats.progress}</div>
          <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-1">In Progress</div>
        </div>

        <div className="card p-8 group">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
            <AlertCircle size={24} />
          </div>
          <div className="text-3xl font-black text-amber-600">{loading ? '...' : stats.pending}</div>
          <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-1">Pending</div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="bg-slate-900 py-24 -mx-4 px-4 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-white text-3xl md:text-5xl font-bold mb-4">Why use CivicReport?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Modern technology met with civic responsibility to create a transparent governance ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: <Smartphone size={32} />, title: "Mobile-First", desc: "Report issues instantly from any device with optimized UI." },
              { icon: <Navigation2 size={32} />, title: "GPS Tagging", desc: "Automatic precise location capturing for every report." },
              { icon: <Users size={32} />, title: "Citizen First", desc: "Direct communication channel with municipal authorities." },
              { icon: <Heart size={32} />, title: "Transparency", desc: "Real-time tracking of report status till final resolution." }
            ].map((f, i) => (
              <div key={i} className="text-center p-6 border border-slate-800 rounded-3xl hover:bg-slate-800/50 transition-all duration-300 group">
                <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-slate-800 text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-white text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- RECENT ACTIVITY --- */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Community Map</h2>
            <Link to="/map" className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline">
              Open Full Map <Navigation2 size={14} />
            </Link>
          </div>
          <div className="card overflow-hidden h-[450px]">
            <ReportMap style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Live Activity</h2>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-2 space-y-2 overflow-y-auto max-h-[450px] custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading activity...</div>
            ) : normalizedReports.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic">No reports yet. Be the first!</div>
            ) : normalizedReports.map((r, i) => (
              <div key={r.id || i} className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-100 group">
                <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                  <SafeThumb raw={r.photo} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{r.title}</h4>
                    <span className={`status ${(r.status || '').toLowerCase()}`}>{r.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-2">
                    <Clock size={10} />
                    {r.date ? new Date(r.date).toLocaleDateString() : 'Just now'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate italic">Reported in Maharashtra</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="px-4 max-w-6xl mx-auto">
        <div className="relative rounded-[3rem] overflow-hidden bg-indigo-600 p-12 md:p-20 text-center">
          <div className="absolute top-0 right-0 p-20 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 p-20 bg-indigo-400/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10 space-y-8">
            <h2 className="text-white text-4xl md:text-6xl font-black">Make Maharashtra Shyne.</h2>
            <p className="text-indigo-100 text-lg max-w-xl mx-auto">Join thousands of citizens making our cities cleaner and safer every single day.</p>
            <div className="pt-4">
              <Link to="/signup" className="btn bg-white text-indigo-600 hover:bg-indigo-50 px-12 py-4 text-lg">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
