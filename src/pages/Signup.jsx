import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await signup(name, email, password);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="relative group max-w-md w-full">
                <div className="absolute inset-0 bg-emerald-600 rounded-[2.5rem] blur-3xl opacity-5 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative space-y-8 bg-white/90 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl border border-white ring-1 ring-slate-200/50">
                    <div>
                        <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200 -rotate-3 transition-transform group-hover:rotate-0">
                            <UserPlus size={28} />
                        </div>
                        <h2 className="mt-6 text-center text-4xl font-black text-slate-900 tracking-tight">
                            Join Us.
                        </h2>
                        <p className="mt-3 text-center text-sm font-medium text-slate-400">
                            Create your <span className="text-indigo-600 font-bold">CiviSense</span> citizen account
                        </p>
                    </div>
                    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                                <AlertCircle className="text-rose-500" size={18} />
                                <p className="text-xs font-bold text-rose-700">{error}</p>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-medium outline-none"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-medium outline-none"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-medium outline-none"
                                    placeholder="Password (min 6 chars)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? 'Creating Account...' : 'Get Started'}
                            </button>
                        </div>
                    </form>
                    <div className="text-center pt-4 border-t border-slate-50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Already a member?{' '}
                            <Link to="/login" className="text-indigo-600 hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
