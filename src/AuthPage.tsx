import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useAuth } from './auth';
import { Btn, Card, Logo, LangSwitch } from './ui';
import { useSettings } from './hooks/useSettings';
import { useI18n } from './i18n';

const Field = (p: { label: string; type?: string; value: string; onChange: (v: string) => void }) => (
  <label className="block">
    <span className="text-sm font-extrabold">{p.label}</span>
    <input
      type={p.type ?? 'text'}
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white font-semibold"
    />
  </label>
);

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { session, signInWithGoogle } = useAuth();
  const { theme, toggleTheme } = useSettings();
  const { t } = useI18n();
  const login = mode === 'login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    if (login) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(t('auth.err.login'));
    } else {
      if (!name.trim()) {
        setMsg(t('auth.err.name'));
      } else if (password.length < 6) {
        setMsg(t('auth.err.short'));
      } else if (password !== confirm) {
        setMsg(t('auth.err.match'));
      } else if (!acceptedTerms) {
        setMsg(t('auth.err.terms'));
      } else if (!acceptedPrivacy) {
        setMsg(t('auth.err.privacy'));
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim(),
              terms_version: '1.0',
              terms_accepted_at: new Date().toISOString(),
              privacy_accepted_at: new Date().toISOString(),
            },
          },
        });
        if (error) setMsg(error.message);
        else if (!data.session) setMsg(t('auth.done.signup'));
      }
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid place-items-center p-5 bg-gradient-to-b from-indigo-50 to-white">
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <LangSwitch />
        <button
          aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <div className="w-full max-w-md fade">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <Card className="p-8">
          <h1 className="text-2xl font-black">{login ? t('auth.login.title') : t('auth.signup.title')}</h1>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            {!login && <Field label={t('auth.name')} value={name} onChange={setName} />}
            <Field label={t('auth.email')} type="email" value={email} onChange={setEmail} />
            <Field label={t('auth.password')} type="password" value={password} onChange={setPassword} />
            {!login && <Field label={t('auth.confirm')} type="password" value={confirm} onChange={setConfirm} />}
            {!login && (
              <div className="space-y-2 text-sm">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-indigo-600"
                    required
                  />
                  <span className="font-semibold text-slate-700">
                    {t('auth.terms.1')}
                    <Link to="/diretrizes" className="font-extrabold text-indigo-600 underline">
                      {t('auth.terms.2')}
                    </Link>
                    {t('auth.terms.3')}
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-indigo-600"
                    required
                  />
                  <span className="font-semibold text-slate-700">
                    {t('auth.privacy.1')}
                    <Link to="/diretrizes" className="font-extrabold text-indigo-600 underline">
                      {t('auth.privacy.2')}
                    </Link>
                    {t('auth.privacy.3')}
                  </span>
                </label>
              </div>
            )}
            {msg && <p role="alert" className="text-sm font-bold text-red-600">{msg}</p>}
            <button
              type="submit"
              disabled={busy}
              className="btn3d w-full rounded-2xl bg-indigo-600 border-b-[#312e81] px-5 py-3 font-extrabold text-white hover:bg-indigo-500 disabled:opacity-40"
            >
              <span className="btn3d-tx">{login ? t('auth.submit.login') : t('auth.submit.signup')}</span>
            </button>
          </form>
          <Btn v="s" className="w-full mt-3" onClick={signInWithGoogle}>{t('auth.google')}</Btn>
          <p className="mt-6 text-center text-sm font-semibold text-slate-600">
            {login ? (
              <>{t('auth.noAccount')} <Link className="font-extrabold text-indigo-600" to="/cadastro">{t('auth.createAccount')}</Link></>
            ) : (
              <>{t('auth.hasAccount')} <Link className="font-extrabold text-indigo-600" to="/login">{t('auth.submit.login')}</Link></>
            )}
          </p>
        </Card>
      </div>
    </div>
  );
}
