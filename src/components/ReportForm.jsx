import React, { useEffect, useRef, useState, useCallback } from 'react'
import LocationIQAutocomplete from './LocationIQAutocomplete'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { apiUrl } from '../utils/api'
import { Link } from 'react-router-dom'
import {
  LogIn,
  MapPin,
  Camera,
  Mic,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Navigation2,
  UploadCloud
} from 'lucide-react'

// react-leaflet
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'

function generateCaptcha() {
  return Math.floor(1000 + Math.random() * 9000)
}
const MAX_IMAGE_COUNT = 5
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/* ---------------- MapPicker ---------------- */

function MapPicker({ lat, lng, onChange, centerOverride }) {
  const [pos, setPos] = useState(lat != null && lng != null ? [lat, lng] : null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (lat != null && lng != null) setPos([Number(lat), Number(lng)])
  }, [lat, lng])

  function ClickHandler() {
    useMapEvents({
      click(e) {
        const { lat: a, lng: b } = e.latlng
        setPos([a, b])
        onChange?.({ lat: a, lng: b })
      },
    })
    return null
  }

  function FlyToCenter({ target }) {
    const map = useMap()
    useEffect(() => {
      if (!target || !Array.isArray(target) || target.length !== 2) return
      map.flyTo(target, 15, { duration: 1.0 })
    }, [target, map])
    return null
  }

  return (
    <div className="mt-4 h-[350px] rounded-[2rem] overflow-hidden border-4 border-white shadow-xl relative group">
      <MapContainer
        center={centerOverride || pos || [19.7507, 75.7139]}
        zoom={pos ? 15 : 7}
        className="h-full w-full"
        maxBounds={[[15.0, 72.0], [22.5, 81.5]]}
        minZoom={6}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler />
        {pos && (
          <Marker position={pos} draggable eventHandlers={{ dragend(e) { const { lat: a, lng: b } = e.target.getLatLng(); setPos([a, b]); onChange?.({ lat: a, lng: b }) } }}>
            <Popup><div className="font-bold text-indigo-600">Issue Location</div></Popup>
          </Marker>
        )}
        <FlyToCenter target={centerOverride} />
      </MapContainer>
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-indigo-600 shadow-lg border border-indigo-100">
        Click to precision tag
      </div>
    </div>
  )
}

/* ---------------- Main ReportForm ---------------- */

export default function ReportForm({ onAddReport }) {
  const { t } = useLanguage()
  const { user, token } = useAuth()
  const [captcha, setCaptcha] = useState(generateCaptcha())
  const [statusMsg, setStatusMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [images, setImages] = useState([])
  const imageInputRef = useRef(null)

  const [formData, setFormData] = useState({
    contact: '', name: user?.name || '', complaintType: '', location: '', address: '', comment: '', email: user?.email || '', captchaInput: '', lat: null, lng: null,
  })

  const [mapCenter, setMapCenter] = useState(null)
  const setField = (k, v) => setFormData((s) => ({ ...s, [k]: v }))
  const handleInputChange = (e) => setField(e.target.name, e.target.value)

  const onPlaceSelected = ({ address, lat, lng }) => {
    setFormData((s) => ({ ...s, location: address, lat, lng }))
    if (lat != null) setMapCenter([lat, lng])
  }

  const captureLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords
      setFormData((s) => ({ ...s, lat, lng, location: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }))
      setMapCenter([lat, lng])
    }, null, { enableHighAccuracy: true })
  }

  function handleFilesSelected(e) {
    const files = Array.from(e.target.files || [])
    const toAdd = files.filter(f => f.size <= MAX_IMAGE_BYTES).map(f => ({ file: f, url: URL.createObjectURL(f) }))
    setImages(prev => [...prev, ...toAdd].slice(0, MAX_IMAGE_COUNT))
  }

  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setStatusMsg('Recording audio...')
    } catch (err) {
      console.error('Recording error:', err)
      setStatusMsg('Microphone access denied or error.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setStatusMsg('Audio captured.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!formData.contact || !formData.complaintType || !formData.comment) {
      setStatusMsg('Please fill all required fields.')
      return
    }
    if (String(formData.captchaInput) !== String(captcha)) {
      setStatusMsg('Invalid Captcha.')
      return
    }

    setSubmitting(true)

    // Safety check: Ensure coordinates are in Maharashtra
    if (formData.lat != null && formData.lng != null) {
      const lat = Number(formData.lat);
      const lng = Number(formData.lng);
      if (lat < 15.0 || lat > 22.5 || lng < 72.0 || lng > 81.5) {
        setStatusMsg('Error: Locations outside Maharashtra are strictly prohibited.');
        setSubmitting(false);
        return;
      }
    }

    const fd = new FormData()
    images.forEach(i => fd.append('photo', i.file))
    if (audioBlob) {
      fd.append('voice_note', audioBlob, 'voice_note.webm')
    }

    Object.keys(formData).forEach(k => {
      if (formData[k] != null) fd.append(k, formData[k])
    })
    // Ensure correct fields for existing backend
    if (formData.complaintType) fd.append('type', formData.complaintType)
    if (formData.comment) fd.append('description', formData.comment)

    try {
      const res = await fetch(apiUrl('/api/reports'), {
        method: 'POST',
        body: fd,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        setStatusMsg('Success! Report submitted.')
        onAddReport?.(await res.json())
        setFormData({ contact: '', name: user?.name || '', complaintType: '', location: '', address: '', comment: '', email: user?.email || '', captchaInput: '', lat: null, lng: null })
        setImages([]); setAudioBlob(null); setAudioUrl(null); setCaptcha(generateCaptcha())
      } else {
        setStatusMsg('Submission failed. Check your data.')
      }
    } catch (err) {
      setStatusMsg('Network Error.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="relative group max-w-2xl mx-auto my-12">
        <div className="absolute inset-0 bg-indigo-600 rounded-[3rem] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
        <div className="relative card p-12 text-center space-y-8 bg-white/80 backdrop-blur-2xl border-white ring-1 ring-slate-200/50">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-inner">
            <ShieldCheck size={40} strokeWidth={1.5} />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Secure Reporting</h2>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed text-sm">
              Log in to the <span className="font-bold text-indigo-600 text-base">CiviSense</span> platform to submit and track municipal grievances in your area.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Link to="/login" className="btn btn-primary py-4 text-base group">
              <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
              Sign in to Continue
            </Link>
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-slate-100"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">or</span>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            <Link to="/signup" className="flex items-center justify-center gap-2 text-slate-600 font-bold hover:text-indigo-600 transition-colors uppercase text-[10px] tracking-widest">
              <UserPlus size={14} /> New citizen? join now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <form onSubmit={handleSubmit} className="space-y-10 group animate-in slide-in-from-bottom-5 duration-700">
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">
              <HelpCircle size={12} /> Civic Support System
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900">Report an Issue.</h2>
            <p className="text-slate-400 text-sm font-medium">Capture details accurately for faster resolution.</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-100">1</div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Draft Mode</p>
              <p className="text-xs font-bold text-slate-700 mt-1">Pending Submission</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* --- LEFT: Primary Info --- */}
          <div className="lg:col-span-7 space-y-10">
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contact Phone *</label>
                  <input name="contact" value={formData.contact} onChange={handleInputChange} required className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-bold text-slate-700 shadow-sm" placeholder="+91 ..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Issue Category *</label>
                  <div className="relative">
                    <select name="complaintType" value={formData.complaintType} onChange={handleInputChange} required className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-black text-indigo-600 appearance-none shadow-sm cursor-pointer">
                      <option value="">-- Categories --</option>
                      <option value="pothole">Road / Pothole</option>
                      <option value="streetlight">Electricity / Lighting</option>
                      <option value="trash">Sanitation / Trash</option>
                      <option value="water">Water Leakage</option>
                      <option value="drainage">Drainage Blocking</option>
                      <option value="other">Other Concerns</option>
                    </select>
                    <ChevronRight size={16} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description *</label>
                <textarea name="comment" value={formData.comment} onChange={handleInputChange} required className="w-full h-44 px-6 py-5 rounded-[2rem] bg-white border border-slate-200 focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-medium leading-relaxed shadow-sm" placeholder="Provide as much detail as possible to help our team identify the problem..." />
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-2">
                  <MapPin size={22} className="text-indigo-600" /> Location tagging
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1 autocomplete-wrapper">
                    <LocationIQAutocomplete onSelect={onPlaceSelected} />
                  </div>
                  <button type="button" onClick={captureLocation} className="h-14 w-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 active:scale-95 transition-all hover:bg-slate-900 group/loc">
                    <Navigation2 size={24} className="group-hover:rotate-45 transition-transform" />
                  </button>
                </div>
                <input name="address" value={formData.address} onChange={handleInputChange} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 focus:bg-white focus:text-slate-800 transition-all outline-none" placeholder="Specific Landmark or Flat Number (optional)" />
                <MapPicker lat={formData.lat} lng={formData.lng} onChange={onPlaceSelected} centerOverride={mapCenter} />
              </div>
            </section>
          </div>

          {/* --- RIGHT: Media & Submission --- */}
          <div className="lg:col-span-5 space-y-8">
            <section className="card p-8 bg-slate-50/30 border-slate-100 ring-1 ring-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                  <Camera size={20} />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight">Visual Evidence</h3>
              </div>

              <div className="space-y-4">
                <label className="block w-full border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center cursor-pointer hover:bg-white hover:border-indigo-400 transition-all group/upload bg-slate-50/50">
                  <input type="file" multiple accept="image/*" onChange={handleFilesSelected} className="hidden" />
                  <UploadCloud size={40} className="mx-auto text-slate-300 group-hover/upload:text-indigo-500 mb-3 transition-colors" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover/upload:text-indigo-900">Upload Media</p>
                  <p className="text-[9px] text-slate-400 mt-2 font-bold italic">Max 5 photos • High resolution preferred</p>
                </label>

                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden ring-4 ring-white shadow-md hover:scale-110 transition-transform group/img">
                        <img src={img.url} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Mic size={20} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Voice Testimony</h3>
                </div>
                <p className="text-[10px] text-slate-400 mb-4 font-medium leading-relaxed italic">Record an audio snippet describing the urgency or context of the report.</p>
                {isRecording ? (
                  <button type="button" onClick={stopRecording} className="w-full py-4 rounded-2xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-[0.2em] animate-pulse shadow-lg shadow-rose-200">Stop Recording</button>
                ) : (
                  <button type="button" onClick={startRecording} className="w-full py-4 rounded-2xl bg-white border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white hover:border-black transition-all shadow-sm">
                    {audioUrl ? 'Re-record Audio' : 'Start Audio Log'}
                  </button>
                )}
                {audioUrl && !isRecording && (
                  <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in zoom-in-95">
                    <p className="text-[9px] font-black uppercase text-indigo-400 mb-2">Voice Preview</p>
                    <audio src={audioUrl} controls className="w-full h-8" />
                  </div>
                )}
              </div>
            </section>

            <section className="card p-8 bg-slate-900 border-slate-800 text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 blur-[60px] rounded-full"></div>
              <div className="absolute bottom-0 left-0 h-40 w-40 bg-indigo-500/5 blur-[60px] rounded-full"></div>

              <h3 className="text-xl font-black mb-6 flex items-center gap-2 relative z-10">
                <Send size={20} className="text-indigo-400" /> Finalize
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="space-y-3 p-5 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 ml-1">Input Verification Code</p>
                  <div className="flex items-stretch gap-3">
                    <div className="bg-slate-800 rounded-2xl px-6 py-4 flex items-center justify-center text-2xl font-black tracking-[0.4em] select-none italic text-indigo-400 shadow-inner border border-white/5">
                      {captcha}
                    </div>
                    <input name="captchaInput" value={formData.captchaInput} onChange={handleInputChange} required className="w-full bg-slate-800 border border-white/5 rounded-2xl px-5 text-xl font-black focus:ring-1 focus:ring-indigo-500/50 transition-all outline-none text-center text-white" placeholder="????" />
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="group w-full py-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-indigo-700 hover:shadow-indigo-500/25 hover:shadow-2xl text-white font-black text-lg tracking-tight active:scale-[0.98] transition-all disabled:opacity-50 border-t border-white/20">
                  {submitting ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      Relodge Complaint <ChevronRight size={22} className="group-hover:translate-x-2 transition-transform" />
                    </div>
                  )}
                </button>

                {statusMsg && (
                  <div className={`animate-in fade-in slide-in-from-top-2 flex items-center gap-3 p-5 rounded-2xl text-xs font-black tracking-tight leading-tight ${statusMsg.includes('Success') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/20 text-rose-400 border border-rose-500/20'}`}>
                    {statusMsg.includes('Success') ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {statusMsg.toUpperCase()}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  )
}
