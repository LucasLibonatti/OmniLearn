import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useAuth } from './auth';
import { Btn, Card, Logo } from './ui';
import { useSettings } from './hooks/useSettings';

const Field = (p: { label: string; type?: string; value: string; onChange: (v: string) => void }) => (
  <label className="block">
    <span className="text-sm font-semibold">{p.label}</span>
    <input
      type={p.type ?? 'text'}
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white"
    />
  </label>
);

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { session, signInWithGoogle } = useAuth();
  const { theme, toggleTheme } = useSettings();
  const login = mode === 'login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    if (login) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg('E-mail ou senha incorretos.');
    } else {
      if (!name.trim()) {
        setMsg('Informe seu nome.');
      } else if (password.length < 6) {
        setMsg('A senha precisa ter pelo menos 6 caracteres.');
      } else if (password !== confirm) {
        setMsg('As senhas não coincidem.');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: name.trim() } } });
        if (error) setMsg(error.message);
        else if (!data.session) setMsg('Conta criada! Enviamos um e-mail para você confirmar. Depois é só entrar.');
      }
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid place-items-center p-5 bg-gradient-to-b from-indigo-50 to-white">
      <button
        aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <div className="w-full max-w-md fade">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <Card className="p-8">
          <h1 className="text-2xl font-extrabold">{login ? 'Bem-vindo de volta' : 'Comece sua jornada'}</h1>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            {!login && <Field label="Nome" value={name} onChange={setName} />}
            <Field label="E-mail" type="email" value={email} onChange={setEmail} />
            <Field label="Senha (mínimo 6 caracteres)" type="password" value={password} onChange={setPassword} />
            {!login && <Field label="Repetir senha" type="password" value={confirm} onChange={setConfirm} />}
            {msg && <p role="alert" className="text-sm font-medium text-red-600">{msg}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {login ? 'Entrar' : 'Criar minha conta'}
            </button>
          </form>
          <Btn v="s" className="w-full mt-3" onClick={signInWithGoogle}>Continuar com Google</Btn>
          <p className="mt-6 text-center text-sm text-slate-600">
            {login ? (
              <>Não possui uma conta? <Link className="font-semibold text-indigo-600" to="/cadastro">Criar conta</Link></>
            ) : (
              <>Já tem conta? <Link className="font-semibold text-indigo-600" to="/login">Entrar</Link></>
            )}
          </p>
        </Card>
      </div>
    </div>
  );
}