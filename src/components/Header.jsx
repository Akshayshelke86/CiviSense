import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { RotateCcw, Menu, X, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react'

const LINKS = [
  { path: '/', label: 'Home' },
  { path: '/report', label: 'Report Issue' },
  { path: '/map', label: 'Map View' },
  { path: '/admin', label: 'Admin' },
]

export default function Header({ onRefresh, onLanguageChange } = {}) {
  const { lang, setLang, t } = useLanguage()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    onLanguageChange?.(lang)
    setMobileOpen(false)
  }, [lang])

  const handleRefresh = () => {
    if (typeof onRefresh === 'function') return onRefresh()
    window.location.reload()
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[100] transition-all duration-300 ${scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-3 shadow-lg shadow-indigo-900/5'
          : 'bg-transparent py-5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* --- LOGO --- */}
            <NavLink to="/" className="group flex items-center gap-3 active:scale-95 transition-transform">
              <div className="relative h-11 w-11 flex items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 group-hover:rotate-12 transition-all">
                <ShieldCheck size={24} />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="leading-none">
                <div className="text-2xl font-black tracking-tighter text-slate-900 leading-tight italic">Civi<span className="text-indigo-600 not-italic">Sense</span></div>
                <div className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest mt-0.5">Govt. of Maharashtra</div>
              </div>
            </NavLink>

            {/* --- DESKTOP NAV --- */}
            <nav className="hidden lg:flex items-center gap-2 bg-slate-900/5 p-1 rounded-2xl border border-slate-200/20" aria-label="Main navigation">
              {LINKS.map((l) => (
                <NavLink
                  key={l.path}
                  to={l.path}
                  className={({ isActive }) =>
                    `px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                      ? 'bg-white text-indigo-600 shadow-md shadow-indigo-900/5'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                    }`
                  }
                >
                  {t?.(l.label) || l.label}
                </NavLink>
              ))}
            </nav>

            {/* --- ACTIONS --- */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Lang switcher */}
              <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${lang === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                >EN</button>
                <button
                  onClick={() => setLang('hi')}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${lang === 'hi' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                >HI</button>
              </div>

              {user ? (
                <div className="flex items-center gap-2 bg-white rounded-2xl p-1 pr-3 border border-slate-200 shadow-sm">
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-[10px] font-black text-slate-900 leading-none truncate max-w-[80px]">{user.name}</p>
                    <p className="text-[9px] text-indigo-500 uppercase font-bold tracking-tighter mt-1">{user.role}</p>
                  </div>
                  <button onClick={logout} className="ml-2 p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <NavLink to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 px-4 py-2">Sign In</NavLink>
                  <NavLink to="/signup" className="btn btn-primary px-6 py-2.5 !rounded-2xl text-xs uppercase tracking-widest">Join</NavLink>
                </div>
              )}

              <button onClick={handleRefresh} className="hidden xl:flex h-10 w-10 btn btn-ghost !p-0">
                <RotateCcw size={16} />
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg active:scale-90 transition-transform"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* --- MOBILE NAV --- */}
        <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 py-6 bg-white/95 backdrop-blur-2xl border-t border-slate-100 space-y-3 shadow-2xl">
            {LINKS.map((l) => (
              <NavLink
                key={l.path}
                to={l.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `flex items-center justify-between px-6 py-4 rounded-2xl text-lg font-black transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span>{t?.(l.label) || l.label}</span>
                {!LINKS.find(link => link.path === l.path)?.isActive && <div className="h-2 w-2 rounded-full bg-slate-200"></div>}
              </NavLink>
            ))}
            {!user && (
              <div className="grid grid-cols-2 gap-4 pt-6">
                <NavLink to="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center py-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-600">Login</NavLink>
                <NavLink to="/signup" onClick={() => setMobileOpen(false)} className="flex items-center justify-center py-4 rounded-2xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-200">Join Now</NavLink>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Dynamic spacer */}
      <div className="h-20" aria-hidden="true"></div>
    </>
  )
}
