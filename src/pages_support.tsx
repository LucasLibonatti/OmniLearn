import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Btn, Card, Logo, LangSwitch } from './ui';
import { Icon } from './icons';
import { Socials } from './components/Socials';
import { sendSupport } from './services/support';
import { useAuth } from './auth';
import { useI18n, type TKey } from './i18n';

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { session } = useAuth();
  const { t } = useI18n();
  const back = session ? '/dashboard' : '/';
  return (
    <div className="min-h-screen mesh">
      <header className="max-w-3xl mx-auto flex items-center justify-between gap-3 p-5">
        <Logo />
        <div className="flex items-center gap-2">
          <LangSwitch className="hidden sm:inline-flex" />
          <Btn v="s" to={back}>
            {t('nav.back')}
          </Btn>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 pb-20 fade">
        <div className="flex items-center gap-3">
          <Icon name="chat" size={52} className="float" />
          <div>
            <h1 className="text-3xl font-black">{title}</h1>
            <p className="text-slate-500 font-semibold">{subtitle}</p>
          </div>
        </div>
        <div className="mt-6">{children}</div>
        <div className="mt-6 flex justify-center sm:hidden">
          <LangSwitch />
        </div>
      </main>
    </div>
  );
}

const inputCls =
  'mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold transition focus:border-indigo-400 focus:outline-none';

export function Support() {
  const { t } = useI18n();
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
    <Shell title={t('support.title')} subtitle={t('support.sub')}>
      {sent ? (
        <Card className="text-center py-10">
          <Icon name="estrela" size={56} className="pop" />
          <h2 className="font-black text-lg mt-3">{t('support.sent')}</h2>
          <p className="text-slate-600 mt-1 font-semibold">{t('support.sent.sub')}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Btn onClick={() => setSent(false)}>{t('support.again')}</Btn>
            <Btn v="s" to="/dashboard">
              {t('nav.dashboard')}
            </Btn>
          </div>
        </Card>
      ) : (
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-extrabold">{t('support.name')}</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder={t('support.name.ph')} />
              </label>
              <label className="block">
                <span className="text-sm font-extrabold">{t('support.email')}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder={t('support.email.ph')}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-extrabold">{t('support.subject')}</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} placeholder={t('support.subject.ph')} />
            </label>
            <label className="block">
              <span className="text-sm font-extrabold">{t('support.message')}</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className={`${inputCls} resize-y`}
                placeholder={t('support.message.ph')}
              />
            </label>
            {err && <p className="text-sm font-bold text-red-600">{err}</p>}
            <Btn type="submit" disabled={busy || message.trim().length < 5}>
              <Send size={16} />
              {busy ? t('support.sending') : t('support.send')}
            </Btn>
          </form>
        </Card>
      )}

      <Card className="mt-6 text-center">
        <p className="font-black">{t('support.socials')}</p>
        <Socials className="mt-4" />
      </Card>

      <p className="text-center text-sm font-semibold text-slate-500 mt-6">
        {t('support.seeGuidelines').replace(t('support.guidelinesLink'), '')}
        <Link to="/diretrizes" className="font-extrabold text-indigo-600">
          {t('support.guidelinesLink')}
        </Link>
        .
      </p>
    </Shell>
  );
}

export function SocialsPage() {
  const { t } = useI18n();
  const redes: { nome: string; desc: TKey }[] = [
    { nome: 'Instagram', desc: 'socials.instagram' },
    { nome: 'TikTok', desc: 'socials.tiktok' },
    { nome: 'YouTube', desc: 'socials.youtube' },
    { nome: 'X', desc: 'socials.x' },
  ];
  return (
    <Shell title={t('socials.title')} subtitle={t('socials.sub')}>
      <div className="grid sm:grid-cols-2 gap-4">
        {redes.map((r) => (
          <Card key={r.nome} className="flex items-start gap-3">
            <Icon name="estrela" size={40} />
            <div>
              <p className="font-black">{r.nome}</p>
              <p className="text-sm font-semibold text-slate-600">{t(r.desc)}</p>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-center text-sm font-semibold text-slate-500 mt-6">{t('socials.hint')}</p>
      <Socials className="mt-4" />
    </Shell>
  );
}
