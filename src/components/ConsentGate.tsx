import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { CURRENT_TERMS_VERSION, useAuth } from '../auth';
import { acceptConsent } from '../services/profile';
import { useI18n } from '../i18n';
import { Btn } from '../ui';

export function ConsentGate({ onAccepted }: { onAccepted: () => void }) {
  const { signOut } = useAuth();
  const { t, tr } = useI18n();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const confirm = async () => {
    if (!terms || !privacy || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await acceptConsent(CURRENT_TERMS_VERSION);
      onAccepted();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr('Aceite dos Termos e Privacidade')}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-xs fade"
    >
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-100 p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
            <ShieldCheck size={24} />
          </span>
          <div>
            <h2 className="text-xl font-black">{tr('Antes de continuar')}</h2>
            <p className="text-xs font-semibold text-slate-500">
              {tr('Versão {v} · Conformidade LGPD', { v: CURRENT_TERMS_VERSION })}
            </p>
          </div>
        </div>

        <p className="text-sm font-semibold text-slate-600 leading-relaxed">
          {tr(
            'Para usar o OmniLearn com segurança, confirme que você leu e aceita os Termos de Uso e a Política de Privacidade (incluindo processamento de IA por terceiros).',
          )}
        </p>

        <div className="space-y-2.5 text-sm">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 w-4 h-4 accent-indigo-600"
            />
            <span className="font-semibold text-slate-700">
              {t('auth.terms.1')}
              <Link
                to="/diretrizes"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-indigo-600 underline"
              >
                {t('auth.terms.2')}
              </Link>
              {t('auth.terms.3')}
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
              className="mt-1 w-4 h-4 accent-indigo-600"
            />
            <span className="font-semibold text-slate-700">
              {t('auth.privacy.1')}
              <Link
                to="/diretrizes"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-indigo-600 underline"
              >
                {t('auth.privacy.2')}
              </Link>
              {t('auth.privacy.3')}
            </span>
          </label>
        </div>

        {err && (
          <p role="alert" className="text-sm font-bold text-red-600">
            {err}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Btn className="flex-1" disabled={!terms || !privacy || busy} onClick={confirm}>
            {busy ? tr('Salvando…') : tr('Aceitar e continuar')}
          </Btn>
          <Btn v="s" onClick={() => void signOut()} disabled={busy}>
            {tr('Sair')}
          </Btn>
        </div>
      </div>
    </div>
  );
}
