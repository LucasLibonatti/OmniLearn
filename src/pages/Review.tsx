import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Btn, Card, StatusDot } from '../ui';
import { Icon } from '../icons';
import { EmptyState, ErrorState, Skeleton } from '../components/states';
import { useAuth } from '../auth';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../i18n';
import { startSession } from '../services/sessions';
import * as statsApi from '../services/stats';

export default function Review() {
  const { tr } = useI18n();
  const { session } = useAuth();
  const userId = session?.user.id;
  const nav2 = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const weak = useAsync(() => (userId ? statsApi.weakSpots() : Promise.resolve([])), [userId]);

  const practice = async (topic: string, subjectId: string) => {
    if (!subjectId) {
      setMsg(tr('Não foi possível abrir a prática deste assunto.'));
      return;
    }
    setBusy(topic);
    setMsg(null);
    try {
      const id = await startSession({ subjectId, mode: 'topic', topicFilter: topic, planned: 18 });
      nav2(`/sessao/${id}`);
    } catch (e) {
      setMsg(tr('Erro: {msg}', { msg: (e as Error).message }));
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">{tr('Vamos reforçar seus pontos fracos.')}</h1>
      {msg && <p className="text-sm font-medium text-red-600">{msg}</p>}
      {weak.loading ? (
        <Skeleton className="h-28" />
      ) : weak.error ? (
        <ErrorState message={weak.error} onRetry={weak.reload} />
      ) : (weak.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Icon name="party" size={56} />}
          title={tr('Nenhum erro recente!')}
          desc={tr('Continue praticando para manter o ritmo.')}
          action={<Btn to="/dashboard">{tr('Voltar')}</Btn>}
        />
      ) : (
        (weak.data ?? []).map((w) => (
          <Card key={w.topic} className="flex items-center gap-4 flex-wrap">
            <div className="flex-1">
              <h2 className="font-bold text-lg">{w.topic}</h2>
              <p className="text-slate-600 text-sm">
                {tr('Você errou {n} de {of} questões.', { n: w.wrong, of: w.of })}
              </p>
              <p className="text-sm font-semibold mt-1.5 inline-flex items-center gap-2">
                <StatusDot tone={w.tone} /> {tr('Nível')}: {w.level}
              </p>
            </div>
            <Btn onClick={() => void practice(w.topic, w.subject_id)} disabled={busy === w.topic}>
              {busy === w.topic ? tr('Abrindo…') : tr('Praticar')}
            </Btn>
          </Card>
        ))
      )}
    </div>
  );
}
