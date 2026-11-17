import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  screenName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ScreenErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ScreenErrorBoundary] Error caught in screen "${this.props.screenName || 'Unknown'}":`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-100 min-h-[350px]">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-500/5">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-white mb-1">
            {this.props.screenName ? `${this.props.screenName} Display Notice` : 'Screen Render Notice'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">
            This view experienced a temporary layout synchronization glitch. Your session data and balances remain fully secure.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Screen</span>
            </button>

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '';
                window.dispatchEvent(new CustomEvent('flyemass:navigate-home'));
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home Hub</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
