import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Btn, Card, StatusDot } from '../ui';
import { EmojiIcon, Icon, flameFor } from '../icons';
import { EmptyState, ErrorState, Spinner } from '../components/states';
import { WeekStrip } from '../components/WeekStrip';
import { useAuth } from '../auth';
import { useAsync } from '../hooks/useAsync';
import { useAppData } from '../context/AppDataContext';
import { useI18n } from '../i18n';
import { getProfile } from '../services/profile';
import { getSession, sessionTopicBreakdown } from '../services/sessions';
import { newlyUnlocked } from '../services/achievements';
import * as statsApi from '../services/stats';

export default function Result() {
  const { tr } = useI18n();
  const { sessionId } = useParams();
  const { session } = useAuth();
  const { profile: profileCache, reloadAllSubjects } = useAppData();
  const userId = session?.user.id;

  // Sincroniza o cache global (XP, nível, ofensiva e progresso das matérias) após concluir a sessão
  useEffect(() => {
    void profileCache.reload();
    void reloadAllSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const data = useAsync(async () => {
    if (!sessionId) return null;
    const sess = await getSession(sessionId);
    const [topics, profile, week, achievements] = await Promise.all([
      sessionTopicBreakdown(sessionId),
      userId ? getProfile() : Promise.resolve(null),
      userId ? statsApi.studiedDates(7) : Promise.resolve<string[]>([]),
      userId && sess ? newlyUnlocked(sess.started_at) : Promise.resolve([]),
    ]);
    return { sess, topics, profile, week, achievements };
  }, [sessionId, userId]);

  if (data.loading) return <Spinner label={tr('Carregando resultado…')} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data?.sess) {
    return <EmptyState title={tr('Resultado não encontrado')} action={<Btn to="/dashboard">{tr('Voltar')}</Btn>} />;
  }

  const { sess, topics, profile, week, achievements } = data.data;
  const pct = sess.total ? Math.round((sess.correct / sess.total) * 100) : 0;
  const good = topics.filter((t) => t.correct > 0).sort((a, b) => b.correct - a.correct);
  const bad = topics.filter((t) => t.wrong > 0).sort((a, b) => b.wrong - a.wrong);

  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <Icon name="trofeu" size={72} className="pop mx-auto" />
      <h1 className="text-3xl font-extrabold">{tr('Sessão concluída!')}</h1>
      <p className="text-slate-600">{tr('Você completou sua sessão de hoje.')}</p>
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-2xl font-extrabold">
            {sess.correct} / {sess.total}
          </p>
        </Card>
        <Card>
          <p className="text-2xl font-extrabold">{pct}%</p>
          <p className="text-xs text-slate-500">{tr('de acerto')}</p>
        </Card>
        <Card>
          <p className="text-2xl font-extrabold text-amber-500">+{sess.xp_gained} XP</p>
        </Card>
      </div>
      <Card className="text-left">
        <p className="font-bold text-orange-600 mb-3 flex items-center gap-1.5">
          <Icon name={flameFor(profile?.streak ?? 0)} size={22} />
          {profile && profile.streak > 0
            ? tr('Sua sequência continua! {n} dias', { n: profile.streak })
            : tr('Comece sua sequência!')}
        </p>
        <WeekStrip dates={week} />
      </Card>
      <div className="grid sm:grid-cols-2 gap-3 text-left">
        <Card>
          <h2 className="font-bold">{tr('Você mandou bem em:')}</h2>
          {good.length ? (
            good.slice(0, 4).map((t) => (
              <p key={t.topic} className="mt-2.5 flex items-center gap-2.5 font-medium">
                <StatusDot tone="emerald" />
                <span>{t.topic}</span>
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-500 mt-2">—</p>
          )}
        </Card>
        <Card>
          <h2 className="font-bold">{tr('Vale revisar:')}</h2>
          {bad.length ? (
            bad.slice(0, 4).map((t) => (
              <p key={t.topic} className="mt-2.5 flex items-center gap-2.5 font-medium">
                <StatusDot tone="rose" />
                <span>{t.topic}</span>
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-500 mt-2 inline-flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              {tr('Nada para revisar.')}
            </p>
          )}
        </Card>
      </div>
      {achievements.length > 0 && (
        <Card className="text-left">
          <h2 className="font-bold mb-2">{tr('Novas conquistas')}</h2>
          <div className="flex flex-wrap gap-3">
            {achievements.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 font-semibold pop">
                <EmojiIcon emoji={a.icon} size={22} /> {a.title}
              </span>
            ))}
          </div>
        </Card>
      )}
      <div className="flex gap-3 justify-center">
        <Btn to="/revisao">{tr('Revisar meus erros')}</Btn>
        <Btn v="s" to="/dashboard">
          {tr('Voltar ao início')}
        </Btn>
      </div>
    </div>
  );
}
