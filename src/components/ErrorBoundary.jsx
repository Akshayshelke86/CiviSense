import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                    <div className="max-w-md w-full text-center space-y-6 bg-white p-12 rounded-[2.5rem] shadow-2xl border border-white">
                        <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-slate-900">Something went wrong.</h2>
                            <p className="text-slate-500 font-medium">We encountered an unexpected error. Please try refreshing the page.</p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
                        >
                            Refresh Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
