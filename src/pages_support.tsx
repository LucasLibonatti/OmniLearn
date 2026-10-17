import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Btn, Card, Logo } from './ui';
import { Icon } from './icons';
import { Socials } from './components/Socials';
import { sendSupport } from './services/support';
import { useAuth } from './auth';

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { session } = useAuth();
  const back = session ? '/dashboard' : '/';
  return (
    <div className="min-h-screen mesh">
      <header className="max-w-3xl mx-auto flex items-center justify-between p-5">
        <Logo />
        <Btn v="s" to={back}>
          Voltar
        </Btn>
      </header>
      <main className="max-w-3xl mx-auto px-5 pb-20 fade">
        <div className="flex items-center gap-3">
          <Icon name="chat" size={52} className="float" />
          <div>
            <h1 className="text-3xl font-extrabold">{title}</h1>
            <p className="text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}

const inputCls =
  'mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus:border-indigo-400 focus:outline-none';

export function Support() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await sendSupport({ name, email, subject, message });
      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Suporte" subtitle="Precisa de ajuda ou quer dar uma sugestão? Fale com a gente.">
      {sent ? (
        <Card className="text-center py-10">
          <Icon name="estrela" size={56} className="pop" />
          <h2 className="font-bold text-lg mt-3">Mensagem enviada!</h2>
          <p className="text-slate-600 mt-1">Obrigado pelo contato. Vamos responder o mais rápido possível.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Btn onClick={() => setSent(false)}>Enviar outra</Btn>
            <Btn v="s" to="/dashboard">
              Ir para o painel
            </Btn>
          </div>
        </Card>
      ) : (
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold">Seu nome (opcional)</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Como podemos te chamar?" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Seu e-mail (opcional)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="Para podermos responder"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-semibold">Assunto</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={inputCls}
                placeholder="Ex.: dúvida, sugestão, problema técnico…"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Mensagem</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className={`${inputCls} resize-y`}
                placeholder="Escreva sua mensagem…"
              />
            </label>
            {err && <p className="text-sm font-medium text-red-600">{err}</p>}
            <Btn type="submit" disabled={busy || message.trim().length < 5}>
              <Send size={16} />
              {busy ? 'Enviando…' : 'Enviar mensagem'}
            </Btn>
          </form>
        </Card>
      )}

      <Card className="mt-6 text-center">
        <p className="font-bold">Também estamos nas redes</p>
        <Socials className="mt-4" />
      </Card>

      <p className="text-center text-sm text-slate-500 mt-6">
        Veja também as{' '}
        <Link to="/diretrizes" className="font-semibold text-indigo-600">
          diretrizes
        </Link>
        .
      </p>
    </Shell>
  );
}

export function SocialsPage() {
  const redes = [
    { nome: 'Instagram', desc: 'Bastidores, dicas de estudo e novidades.' },
    { nome: 'TikTok', desc: 'Vídeos curtos e truques para estudar melhor.' },
    { nome: 'YouTube', desc: 'Tutoriais e como aproveitar o OmniLearn.' },
    { nome: 'X', desc: 'Avisos rápidos e atualizações.' },
  ];
  return (
    <Shell title="Redes sociais" subtitle="Acompanhe o OmniLearn e fique por dentro das novidades.">
      <div className="grid sm:grid-cols-2 gap-4">
        {redes.map((r) => (
          <Card key={r.nome} className="flex items-start gap-3">
            <Icon name="estrela" size={40} />
            <div>
              <p className="font-bold">{r.nome}</p>
              <p className="text-sm text-slate-600">{r.desc}</p>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-center text-sm text-slate-500 mt-6">Toque em uma rede para seguir — em breve os links estarão ativos.</p>
      <Socials className="mt-4" />
    </Shell>
  );
}
