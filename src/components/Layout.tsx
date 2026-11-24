import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, BookOpen, Home, Layers, LifeBuoy, LogOut, Moon, ScrollText, Sun, Trophy, User } from 'lucide-react';
import { Avatar, Logo } from '../ui';
import { ConsentGate } from './ConsentGate';
import { CURRENT_TERMS_VERSION, useAuth } from '../auth';
import { useProfile } from '../hooks/useApp';
import { useAsync } from '../hooks/useAsync';
import { useSettings } from '../hooks/useSettings';
import { useI18n } from '../i18n';
import * as statsApi from '../services/stats';

const navItems = (tr: (s: string, vars?: Record<string, string | number>) => string) => [
  { to: '/dashboard', label: tr('Início'), icon: Home },
  { to: '/materias', label: tr('Minhas matérias'), icon: BookOpen },
  { to: '/flashcards', label: tr('Flashcards'), icon: Layers },
  { to: '/estatisticas', label: tr('Estatísticas'), icon: BarChart3 },
  { to: '/conquistas', label: tr('Conquistas'), icon: Trophy },
  { to: '/perfil', label: tr('Perfil'), icon: User },
];

export default function Layout({ children }: { children?: ReactNode }) {
  const { tr } = useI18n();
  const profileState = useProfile();
  const profile = profileState.data;
  const { session, signOut } = useAuth();
  const { theme, reminder, toggleTheme } = useSettings();
  const loc = useLocation();
  const today = useAsync(
    () => (reminder && session?.user.id ? statsApi.answeredToday() : Promise.resolve(0)),
    [reminder, session?.user.id],
  );
  const name = profile?.name ?? tr('Estudante');
  const needsConsent =
    !profileState.loading &&
    Boolean(profile) &&
    profile?.terms_version !== CURRENT_TERMS_VERSION &&
    loc.pathname !== '/diretrizes';
  const nav = navItems(tr);

  useEffect(() => {
    if (!reminder) return;
    const check = () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const key = 'omni-reminder-shown';
      const day = new Date().toDateString();
      if (localStorage.getItem(key) === day) return;
      if (new Date().getHours() < 19) return;
      const goal = profile?.daily_goal ?? 18;
      const done = today.data ?? 0;
      if (done >= goal) return;
      new Notification(tr('Hora de estudar! 📚'), {
        body:
          done > 0
            ? tr('Você fez {n} de {goal} questões hoje. Bora manter a sequência?', { n: done, goal })
            : tr('Você ainda não estudou hoje. Bora manter a sequência?'),
      });
      localStorage.setItem(key, day);
    };
    check();
    const t = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [reminder, profile?.daily_goal, today.data, tr]);

  return (
    <div className="min-h-screen md:pl-64">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-slate-100 p-5">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1" aria-label={tr('Principal')}>
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`
              }
            >
              <n.icon size={20} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <Link
            to="/suporte"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 font-medium text-slate-600 hover:bg-slate-50"
          >
            <LifeBuoy size={20} />
            {tr('Suporte')}
          </Link>
          <Link
            to="/diretrizes"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 font-medium text-slate-600 hover:bg-slate-50"
          >
            <ScrollText size={20} />
            {tr('Diretrizes')}
          </Link>
          <div className="flex items-center gap-3">
            <Avatar name={name} src={profile?.avatar_url} size={40} />
            <div className="text-sm min-w-0">
              <p className="font-semibold truncate">{name}</p>
              <p className="text-slate-500">{tr('Nível {n}', { n: profile?.level ?? 1 })}</p>
            </div>
            <div className="ml-auto flex items-center">
              <button
                aria-label={theme === 'dark' ? tr('Usar tema claro') : tr('Usar tema escuro')}
                onClick={toggleTheme}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                aria-label={tr('Sair')}
                onClick={() => void signOut()}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main key={loc.pathname} className="max-w-5xl mx-auto p-5 md:p-10 pb-28 fade">
        {children ?? <Outlet />}
      </main>
      {needsConsent && <ConsentGate onAccepted={() => void profileState.reload()} />}
      <nav aria-label={tr('Mobile')} className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 flex justify-around py-2 z-10">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex flex-col items-center text-[11px] gap-0.5 px-2 py-1 ${isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`
            }
          >
            <n.icon size={22} />
            {n.label.replace(tr('Minhas '), '')}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
