import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = window.location.pathname;
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {this.props.fallbackTitle || 'Runtime Render Notice'}
                </h2>
                <p className="text-sm text-slate-400">
                  A component encountered an issue during rendering. The application state has been preserved.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack && (
                  <div className="mt-2 text-slate-500 text-[11px]">
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleResetCache}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold rounded-xl text-sm border border-rose-500/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Reset Cache & Restart
              </button>
            </div>

            <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
              <a
                href="http://localhost:3030"
                className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                Mobile App (:3030)
              </a>
              <a
                href="http://localhost:5173"
                className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Admin Command Center (:5173)
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
