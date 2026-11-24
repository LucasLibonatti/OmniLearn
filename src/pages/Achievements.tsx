import { Lock } from 'lucide-react';
import { Card } from '../ui';
import { EmojiIcon } from '../icons';
import { ErrorState, Skeleton } from '../components/states';
import { useAuth } from '../auth';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../i18n';
import { listAchievements } from '../services/achievements';
import { formatDate } from '../lib/dates';

export default function Achievements() {
  const { tr } = useI18n();
  const { session } = useAuth();
  const userId = session?.user.id;
  const data = useAsync(() => (userId ? listAchievements() : Promise.resolve([])), [userId]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">{tr('Conquistas')}</h1>
      {data.loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data.error ? (
        <ErrorState message={data.error} onRetry={data.reload} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(data.data ?? []).map((a) => (
            <Card key={a.id} className={`flex gap-4 items-center ${a.unlocked ? '' : 'opacity-50 grayscale'}`}>
              <EmojiIcon emoji={a.icon} size={44} />
              <div>
                <p className="font-bold">{a.title}</p>
                <p className="text-sm text-slate-600">{a.descr}</p>
                <p className="text-xs font-semibold mt-1 flex items-center gap-1">
                  {a.unlocked ? (
                    a.unlocked_at ? (
                      tr('✓ Desbloqueada em {date}', { date: formatDate(a.unlocked_at) })
                    ) : (
                      tr('✓ Desbloqueada')
                    )
                  ) : (
                    <>
                      <Lock size={12} />
                      {tr('Bloqueada')}
                    </>
                  )}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
