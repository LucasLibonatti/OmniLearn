import { CheckCircle2 } from 'lucide-react';
import { Bar, Card, Ring, StatusDot } from '../ui';
import { Icon, type IconName } from '../icons';
import { ErrorState, Spinner } from '../components/states';
import { useAuth } from '../auth';
import { useAsync } from '../hooks/useAsync';
import { useProfile, useSubjects } from '../hooks/useApp';
import { useI18n } from '../i18n';
import * as statsApi from '../services/stats';

export default function Stats() {
  const { tr } = useI18n();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: profile } = useProfile();
  const { data: subjectsCached } = useSubjects();

  const data = useAsync(async () => {
    if (!userId) return null;
    const [overview, weak] = await Promise.all([statsApi.statsOverview(), statsApi.weakSpots()]);
    return {
      answered: overview.answered,
      acc: overview.accuracy,
      week: overview.weeklyAccuracy,
      masteryVal: overview.mastery,
      perfs: overview.subjectPerformance,
      weak,
    };
  }, [userId]);

  if (data.loading) return <Spinner label={tr('Carregando estatísticas…')} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data) return null;

  const { answered, acc, week, masteryVal, perfs, weak } = data.data;
  const subjectList = subjectsCached ?? [];
  const perfOf = (sid: string) => perfs.find((p) => p.subject_id === sid)?.pct ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">{tr('Sua evolução')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['fogo30', tr('{n} dias de sequência', { n: profile?.streak ?? 0 })],
          ['trofeu', tr('{n} XP', { n: profile?.xp ?? 0 })],
          ['livro', tr('{n} questões respondidas', { n: answered })],
          ['alvo', tr('{pct}% de aproveitamento', { pct: acc })],
        ].map(([e, t]) => (
          <Card key={t}>
            <Icon name={e as IconName} size={32} />
            <p className="font-bold mt-1">{t}</p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-bold mb-4">{tr('Evolução semanal')}</h2>
          <div className="flex items-end gap-2 h-40">
            {week.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-xs font-semibold">{d.count ? `${d.pct}%` : ''}</span>
                <div className="w-full rounded-t-xl bg-indigo-500 transition-all" style={{ height: `${Math.max(d.pct, 3)}%` }} />
                <span className="text-xs text-slate-500 mt-1">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col items-center text-center gap-3">
          <h2 className="font-bold">{tr('Domínio estimado do conteúdo')}</h2>
          {masteryVal === null ? (
            <div className="grid place-items-center h-[150px] text-slate-500 font-semibold">{tr('Ainda coletando dados')}</div>
          ) : (
            <Ring v={masteryVal} />
          )}
          <p className="text-xs text-slate-500">
            {tr(
              'Este índice é baseado no seu desempenho recente, acertos, erros, dificuldade das questões e consistência dos estudos. Ele não representa uma probabilidade real de aprovação.',
            )}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="font-bold mb-3">{tr('Desempenho por matéria')}</h2>
        {subjectList.length === 0 ? (
          <p className="text-sm text-slate-500">{tr('Sem dados ainda.')}</p>
        ) : (
          <div className="space-y-3">
            {subjectList.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between text-sm font-semibold">
                  <span>{s.name}</span>
                  <span>{perfOf(s.id)}%</span>
                </div>
                <Bar v={perfOf(s.id)} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-bold">{tr('Continue praticando')}</h2>
          {weak.length ? (
            weak.slice(0, 4).map((w) => (
              <p key={w.topic} className="mt-2.5 flex items-center gap-2.5 font-medium">
                <StatusDot tone={w.tone} />
                <span>{w.topic}</span>
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-500 mt-2 inline-flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              {tr('Nada aqui.')}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
