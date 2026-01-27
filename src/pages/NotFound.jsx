import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative">
                    <h1 className="text-[12rem] font-black text-slate-100 leading-none select-none">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-24 w-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 rotate-12">
                            <span className="text-4xl font-black">?</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Lost in the City?</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        The page you're looking for has moved or doesn't exist. Let's get you back on track.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Link to="/" className="btn btn-primary py-4 text-base group">
                        <Home size={20} />
                        Back to Homepage
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors uppercase text-xs tracking-widest"
                    >
                        <ArrowLeft size={14} /> Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
