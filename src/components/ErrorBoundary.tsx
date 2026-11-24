import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { tr } from '../i18n';

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('OmniLearn render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen grid place-items-center p-5 bg-slate-50">
        <div className="w-full max-w-md rounded-3xl bg-white border border-slate-100 shadow-xl p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 grid place-items-center">
            <AlertTriangle size={28} />
          </div>
          <h1 className="text-2xl font-black">{tr('Ops, algo inesperado aconteceu')}</h1>
          <p className="text-sm font-semibold text-slate-600">
            {tr('Seus dados estão seguros. Recarregue a página ou volte para o início para continuar estudando.')}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn3d inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-extrabold bg-indigo-600 text-white border-b-[#312e81] hover:bg-indigo-500"
            >
              <span className="btn3d-tx">
                <RotateCcw size={16} />
                {tr('Recarregar página')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              className="btn3d inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-extrabold bg-white text-slate-600 border-b-slate-300 hover:bg-slate-50"
            >
              <span className="btn3d-tx">
                <Home size={16} />
                {tr('Ir para o início')}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
