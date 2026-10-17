import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { tr } from '../i18n';

export interface ConfirmOptions {
  /** Título curto, ex.: "Excluir matéria". */
  title: string;
  /** Pergunta principal, ex.: 'Tem certeza que deseja excluir a matéria "{name}"?'. */
  message?: string;
  /** Explicação das consequências exibida em texto menor. */
  note?: string;
  /** Rótulo do botão de confirmação (padrão: "Confirmar"). */
  confirmLabel?: string;
  /** Rótulo do botão de cancelamento (padrão: "Cancelar"). */
  cancelLabel?: string;
  /** Usa cor de perigo (vermelho) no botão de confirmação. */
  danger?: boolean;
}

function Dialog({ opts, onResolve }: { opts: ConfirmOptions; onResolve: (v: boolean) => void }) {
  const { title, message, note, confirmLabel, cancelLabel, danger } = opts;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onResolve(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onResolve]);

  return (
    <div
      role="presentation"
      onClick={() => onResolve(false)}
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/50 p-4 fade"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white border border-slate-100 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.55)] p-6"
      >
        <h2 className="text-xl font-extrabold">{title}</h2>
        {message && <p className="mt-2 text-slate-700 font-semibold">{message}</p>}
        {note && <p className="mt-2 text-sm text-slate-500">{note}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            autoFocus={danger}
            onClick={() => onResolve(false)}
            className="rounded-2xl px-6 py-3 font-extrabold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          >
            {cancelLabel ?? tr('Cancelar')}
          </button>
          <button
            type="button"
            autoFocus={!danger}
            onClick={() => onResolve(true)}
            className={`rounded-2xl px-6 py-3 font-extrabold text-white ${
              danger ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {confirmLabel ?? tr('Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Substituto interno do `window.confirm`: mostra um diálogo no próprio app
 * (com o tema, idioma e estilo do OmniLearn) e devolve uma Promise<boolean>.
 */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);
    let done = false;
    const finish = (v: boolean) => {
      if (done) return;
      done = true;
      resolve(v);
      setTimeout(() => {
        root.unmount();
        el.remove();
      }, 0);
    };
    root.render(<Dialog opts={opts} onResolve={finish} />);
  });
}
