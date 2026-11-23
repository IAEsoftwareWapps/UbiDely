import { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Error inesperado al renderizar la aplicación.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UbiDely render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#111413] text-[#E1E3E1] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#191D1C] border border-[#FF5449]/40 rounded-2xl p-6 space-y-3 text-center">
            <h1 className="text-lg font-bold text-[#E1E3E1]">Error al cargar UbiDely</h1>
            <p className="text-xs text-[#A0ABA6] break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[40px] px-5 rounded-full bg-[#006A60] hover:bg-[#004D40] text-xs font-bold text-[#E1E3E1] cursor-pointer"
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
