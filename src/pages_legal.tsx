import { Link } from 'react-router-dom';
import { Btn, Card, Logo, LangSwitch } from './ui';
import { useI18n } from './i18n';

function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen">
      <header className="max-w-3xl mx-auto flex items-center justify-between gap-3 p-5">
        <Logo />
        <div className="flex items-center gap-2">
          <LangSwitch className="hidden sm:inline-flex" />
          <Btn v="s" to="/">
            {t('nav.back')}
          </Btn>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 pb-20 fade">
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="text-sm font-semibold text-slate-500 mt-1">
          {t('legal.updated')}: {updated}
        </p>
        <Card className="mt-6 space-y-5 leading-relaxed font-semibold">{children}</Card>
        <p className="text-xs font-semibold text-slate-400 mt-4">{t('legal.disclaimer')}</p>
        <div className="mt-6 flex justify-center sm:hidden">
          <LangSwitch />
        </div>
      </main>
    </div>
  );
}

const H = ({ children }: { children: React.ReactNode }) => <h2 className="font-black text-lg pt-2">{children}</h2>;

export function Guidelines() {
  const { t } = useI18n();
  return (
    <LegalShell title={t('legal.title')} updated={t('legal.today')}>
      <p>{t('legal.welcome')}</p>

      <H>{t('legal.h.service')}</H>
      <p>{t('legal.p.service')}</p>

      <H>{t('legal.h.acceptable')}</H>
      <ul className="list-disc pl-5 space-y-1">
        <li>{t('legal.li.1')}</li>
        <li>{t('legal.li.2')}</li>
        <li>{t('legal.li.3')}</li>
        <li>{t('legal.li.4')}</li>
      </ul>

      <H>{t('legal.h.ai')}</H>
      <p>{t('legal.p.ai')}</p>

      <H>{t('legal.h.law')}</H>
      <p>{t('legal.p.law')}</p>

      <H>{t('legal.h.privacy')}</H>
      <p>{t('legal.p.privacy')}</p>

      <H>{t('legal.h.property')}</H>
      <p>{t('legal.p.property')}</p>

      <H>{t('legal.h.changes')}</H>
      <p>{t('legal.p.changes')}</p>
    </LegalShell>
  );
}

export function NotFound() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen grid place-items-center p-5">
      <div className="max-w-md w-full text-center fade">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="p-8">
          <p className="text-6xl font-black text-indigo-600">404</p>
          <h1 className="text-2xl font-black mt-2">{t('404.title')}</h1>
          <p className="text-slate-600 mt-2 font-semibold">{t('404.sub')}</p>
          <div className="mt-6 flex justify-center gap-2">
            <Btn to="/dashboard">{t('nav.dashboard')}</Btn>
            <Btn v="s" to="/">
              {t('nav.home')}
            </Btn>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-500">
            {t('404.help').replace(t('nav.guidelines'), '')}
            <Link className="font-extrabold text-indigo-600" to="/diretrizes">
              {t('nav.guidelines')}
            </Link>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}
