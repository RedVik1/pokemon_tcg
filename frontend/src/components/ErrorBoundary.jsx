import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("!!! ERROR_BOUNDARY_CRASH !!!", { error, info });
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[100dvh] bg-[#0a0a0a] text-white flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle size={32} className="text-rose-500" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-500 mb-8">
              An unexpected error occurred. You can try reloading the page or go back to the dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-teal-500 text-black font-bold rounded-xl active:bg-teal-600 hover:bg-teal-400 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Try Again
              </button>
              <button
                onClick={() => { window.location.href = "/dashboard"; }}
                className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl active:bg-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Home size={16} /> Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
