import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Btn } from '../ui';
import { Icon } from '../icons';
import { EmptyState, ErrorState, Skeleton } from '../components/states';
import { SubjectCard } from '../components/SubjectCard';
import { useArchivedSubjects, useSubjects } from '../hooks/useApp';
import { useI18n } from '../i18n';

export default function Subjects() {
  const { tr } = useI18n();
  const nav2 = useNavigate();
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const subjects = useSubjects();
  const archived = useArchivedSubjects();
  const list = tab === 'active' ? subjects : archived;
  const data = list.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">{tr('Minhas matérias')}</h1>
        <Btn onClick={() => nav2('/materias/nova')}>
          <Plus size={18} />
          {tr('Nova matéria')}
        </Btn>
      </div>

      <div
        role="tablist"
        aria-label={tr('Minhas matérias')}
        className="mb-6 inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1"
      >
        {(
          [
            ['active', tr('Ativas')],
            ['archived', tr('Arquivadas')],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === value ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {list.loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={() => void list.reload()} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Icon name="livro" size={56} />}
          title={tab === 'active' ? tr('Nenhuma matéria ainda') : tr('Nenhuma matéria arquivada')}
          desc={
            tab === 'active'
              ? tr('Crie uma matéria e envie seus materiais para começar.')
              : tr('Arquive uma matéria para vê-la aqui. Você pode reativá-la quando quiser.')
          }
          action={tab === 'active' ? <Btn onClick={() => nav2('/materias/nova')}>{tr('Nova matéria')}</Btn> : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.map((s) => (
            <SubjectCard key={s.id} s={s} manage={tab === 'active'} archived={tab === 'archived'} />
          ))}
        </div>
      )}
    </div>
  );
}
