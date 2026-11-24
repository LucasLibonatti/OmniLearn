import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Layers, RotateCcw } from 'lucide-react';
import { Bar, Btn, Card } from '../ui';
import { Icon } from '../icons';
import { EmptyState, ErrorState, Spinner } from '../components/states';
import { useAuth } from '../auth';
import { useAsync } from '../hooks/useAsync';
import { useAppData } from '../context/AppDataContext';
import { useI18n } from '../i18n';
import { gradeFlashcard, reviewQueue, type Flashcard } from '../services/flashcards';

export default function Flashcards() {
  const { tr } = useI18n();
  const { id } = useParams();
  const nav2 = useNavigate();
  const { session } = useAuth();
  const { profile: profileCache } = useAppData();
  const userId = session?.user.id;
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);
  const [result, setResult] = useState<{ box: number; xp_gained: number } | null>(null);
  const [grading, setGrading] = useState(false);
  const data = useAsync(() => (userId ? reviewQueue(20, id) : Promise.resolve<Flashcard[]>([])), [userId, id]);
  const cards = data.data ?? [];
  const card = cards[idx];

  const grade = async (correct: boolean) => {
    if (!card || grading) return;
    setGrading(true);
    try {
      const res = await gradeFlashcard(card.question.id, correct);
      setResult(res);
      if (res.xp_gained > 0) void profileCache.reload();
    } catch {
      setResult({ box: card.box, xp_gained: 0 });
    } finally {
      setGrading(false);
    }
  };

  const next = () => {
    setShow(false);
    setResult(null);
    setIdx((i) => i + 1);
  };

  if (data.loading) return <Spinner label={tr('Carregando flashcards…')} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;

  if (!card) {
    return (
      <div className="max-w-xl">
        <EmptyState
          icon={<Icon name="alvo" size={56} />}
          title={cards.length === 0 ? tr('Nenhum flashcard por aqui ainda') : tr('Você revisou todos os flashcards de hoje!')}
          desc={
            cards.length === 0
              ? tr('Resolva sessões para os flashcards aparecerem.')
              : tr('Volte amanhã para revisar de novo.')
          }
          action={<Btn onClick={() => nav2('/dashboard')}>{tr('Voltar ao início')}</Btn>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold inline-flex items-center gap-2">
          <Layers size={24} className="text-indigo-600" />
          Flashcards
        </h1>
        <span className="text-sm font-semibold text-slate-500">
          {tr('{n} de {total}', { n: idx + 1, total: cards.length })}
        </span>
      </div>
      <Bar v={((idx + 1) / cards.length) * 100} />

      <Card className="min-h-[220px] flex flex-col justify-center text-center">
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">{card.question.topic}</p>
        <h2 className="text-2xl font-extrabold mt-3">{card.question.prompt}</h2>
        {card.question.options && card.question.options.length > 0 && (
          <ul className="mt-4 space-y-1 text-slate-600">
            {card.question.options.map((o) => (
              <li key={o}>• {o}</li>
            ))}
          </ul>
        )}
        {show && (
          <div className="mt-5 fade">
            <p className="text-sm font-bold text-emerald-600">{tr('Resposta')}</p>
            <p className="text-lg font-semibold">
              {card.question.type === 'match'
                ? (card.question.pairs ?? []).map((p) => p.join(' → ')).join(' · ')
                : card.question.answer}
            </p>
            {card.question.explanation && <p className="text-sm text-slate-600 mt-2">{card.question.explanation}</p>}
          </div>
        )}
      </Card>

      {!show && !result && (
        <Btn className="w-full" onClick={() => setShow(true)}>
          {tr('Mostrar resposta')}
        </Btn>
      )}

      {show && !result && (
        <div className="flex gap-3">
          <Btn v="s" className="flex-1" onClick={() => void grade(false)} disabled={grading}>
            <RotateCcw size={16} /> {tr('Errei')}
          </Btn>
          <Btn className="flex-1" onClick={() => void grade(true)} disabled={grading}>
            <CheckCircle2 size={16} /> {tr('Acertei')}
          </Btn>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <p className="text-center text-sm font-semibold text-slate-600 flex items-center justify-center gap-1.5">
            {result.xp_gained > 0 && (
              <>
                <Icon name="party" size={18} />
                <span className="font-bold text-amber-600">+{result.xp_gained} XP</span> ·
              </>
            )}
            <span>{tr('caixa {n} de 5', { n: result.box })}</span>
          </p>
          <Btn className="w-full" onClick={next}>
            {idx + 1 < cards.length ? tr('Próximo') : tr('Concluir')}
          </Btn>
        </div>
      )}
    </div>
  );
}
