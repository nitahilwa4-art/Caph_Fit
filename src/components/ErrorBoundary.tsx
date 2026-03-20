import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      let parsedError = null;
      try {
        if (this.state.error?.message) {
          parsedError = JSON.parse(this.state.error.message);
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-xl p-6 max-w-lg w-full shadow-xl">
            <h2 className="text-xl font-semibold text-red-400 mb-4">Something went wrong</h2>
            
            {parsedError ? (
              <div className="space-y-3 text-sm">
                <p><span className="text-slate-400">Operation:</span> {parsedError.operationType}</p>
                <p><span className="text-slate-400">Path:</span> {parsedError.path}</p>
                <p><span className="text-slate-400">Error:</span> {parsedError.error}</p>
                <p className="text-xs text-slate-500 mt-4">Please check your permissions or try logging in again.</p>
              </div>
            ) : (
              <div className="text-sm text-slate-300">
                <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
              </div>
            )}
            
            <button
              className="mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-medium"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
