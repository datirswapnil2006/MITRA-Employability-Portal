import React from "react";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoDashboard = () => {
    window.location.href = "/student";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl text-center">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-400">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-xl font-bold mb-2 text-white">Something Went Wrong</h1>
            <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
              {this.state.error?.message || "An unexpected application error occurred while loading this page."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={15} /> Reload Page
              </button>
              <button
                onClick={this.handleGoDashboard}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Home size={15} /> Student Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
