import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Bar, Btn, Card, StatusDot } from '../ui';
import { Icon, flameFor } from '../icons';
import { EmptyState, ErrorState, Skeleton } from '../components/states';
import { SubjectCard } from '../components/SubjectCard';
import { WeekStrip } from '../components/WeekStrip';
import { useAuth } from '../auth';
import { useAsync } from '../hooks/useAsync';
import { useProfile, useSubjects } from '../hooks/useApp';
import { useI18n } from '../i18n';
import { pendingSession } from '../services/sessions';
import * as statsApi from '../services/stats';
import { greeting, todaySP } from '../lib/dates';

export default function Dashboard() {
  const { tr } = useI18n();
  const { session } = useAuth();
  const nav2 = useNavigate();
  const userId = session?.user.id;
  const { data: profile } = useProfile();
  const subjects = useSubjects();
  const today = useAsync(() => (userId ? statsApi.answeredToday() : Promise.resolve(0)), [userId]);
  const week = useAsync(() => (userId ? statsApi.studiedDates(7) : Promise.resolve<string[]>([])), [userId]);
  const pending = useAsync(() => (userId ? pendingSession() : Promise.resolve(null)), [userId]);
  const weak = useAsync(() => (userId ? statsApi.weakSpots() : Promise.resolve([])), [userId]);

  const name = (profile?.name ?? tr('Estudante')).split(' ')[0];
  const done = today.data ?? 0;
  const goal = profile?.daily_goal ?? 18;
  const streak = profile?.streak ?? 0;
  const breaking = streak > 0 && profile?.last_study_date !== todaySP();
  const subjectsData = subjects.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold inline-flex items-center gap-2">
          <span>
            {greeting()}, {name}
          </span>
          <Icon name="wave" size={32} />
        </h1>
        <p className="text-slate-600">{tr('Pronto para estudar hoje?')}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
          <Icon name={flameFor(streak)} size={56} className="float" />
          <p className="text-4xl font-extrabold mt-2">{tr('{n} dias', { n: streak })}</p>
          <p className="text-slate-600">
            {streak === 0 ? tr('Comece sua sequência hoje!') : tr('Você está em uma sequência incrível!')}
          </p>
          <div className="mt-4">
            <WeekStrip dates={week.data ?? []} />
          </div>
        </Card>
        <Card className="md:col-span-2 flex flex-col">
          <p className="font-bold">{tr('Sessão de hoje')}</p>
          <p className="text-sm text-slate-500 mt-1">{tr('{done} / {goal} questões respondidas hoje', { done, goal })}</p>
          <div className="mt-3">
            <Bar v={Math.min(100, (done / goal) * 100)} />
          </div>
          <div className="mt-auto pt-5 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{breaking ? tr('Não deixe sua sequência quebrar!') : tr('Continue assim!')}</p>
            {pending.data ? (
              <Btn to={`/sessao/${pending.data.id}`}>{tr('Continuar sessão')}</Btn>
            ) : subjectsData.length ? (
              <Btn to={`/sessao/configurar/${subjectsData[0].id}`} disabled={!subjectsData[0].questions}>
                {tr('Começar sessão de hoje')}
              </Btn>
            ) : (
              <Btn onClick={() => nav2('/materias/nova')}>{tr('Criar minha primeira matéria')}</Btn>
            )}
          </div>
        </Card>
      </div>

      {subjects.loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : subjects.error ? (
        <ErrorState message={subjects.error} onRetry={() => void subjects.reload()} />
      ) : subjectsData.length === 0 ? (
        <EmptyState
          icon={<Icon name="livro" size={56} />}
          title={tr('Bem-vindo ao OmniLearn!')}
          desc={tr('Crie sua primeira matéria, envie seus slides e deixe a IA montar seus exercícios.')}
          action={<Btn onClick={() => nav2('/materias/nova')}>{tr('Criar minha primeira matéria')}</Btn>}
        />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {subjectsData.slice(0, 3).map((s) => (
            <SubjectCard key={s.id} s={s} />
          ))}
        </div>
      )}

      <Card>
        <h2 className="font-bold text-lg">{tr('Seus pontos de atenção')}</h2>
        {weak.loading ? (
          <Skeleton className="h-16 mt-3" />
        ) : (weak.data ?? []).length === 0 ? (
          <p className="text-slate-600 text-sm mt-2 inline-flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            {tr('Nenhum ponto fraco por aqui. Continue assim!')}
          </p>
        ) : (
          <>
            <p className="text-slate-600 text-sm">{tr('Com base nas suas últimas respostas, recomendamos revisar:')}</p>
            <ul className="my-4 space-y-2.5">
              {(weak.data ?? []).slice(0, 3).map((w) => (
                <li key={w.topic} className="font-medium flex items-center gap-2.5">
                  <StatusDot tone={w.tone} />
                  <span>
                    {w.topic} <span className="text-slate-400 text-sm">{tr('({n} de {of} erradas)', { n: w.wrong, of: w.of })}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Btn to="/revisao">{tr('Revisar agora')}</Btn>
          </>
        )}
      </Card>
    </div>
  );
}
