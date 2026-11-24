import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { Btn } from '../ui';
import { EmptyState, ErrorState, Spinner } from '../components/states';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../i18n';
import { getSubject } from '../services/subjects';
import { listQuestions } from '../services/questions';

export default function PrintSubject() {
  const { tr } = useI18n();
  const { id } = useParams();
  const data = useAsync(async () => {
    if (!id) return null;
    const [subject, questions] = await Promise.all([getSubject(id), listQuestions(id)]);
    return { subject, questions };
  }, [id]);

  if (data.loading) return <Spinner label={tr('Preparando impressão…')} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data?.subject) {
    return <EmptyState title={tr('Matéria não encontrada')} action={<Btn to="/materias">{tr('Voltar')}</Btn>} />;
  }

  const { subject, questions } = data.data;

  return (
    <div className="max-w-3xl mx-auto p-6 text-slate-900">
      <div className="flex items-center justify-between mb-6 no-print">
        <Btn to={`/materias/${subject.id}`} v="s">
          {tr('Voltar')}
        </Btn>
        <Btn onClick={() => window.print()}>
          <Printer size={16} /> {tr('Imprimir / salvar PDF')}
        </Btn>
      </div>
      <h1 className="text-2xl font-extrabold">{subject.name}</h1>
      <p className="text-sm text-slate-500 mb-6">
        {subject.topic || ''} · {tr('{n} questões', { n: questions.length })}
      </p>

      <ol className="space-y-6">
        {questions.map((q, i) => (
          <li key={q.id} className="break-inside-avoid">
            <p className="font-semibold">
              {i + 1}. {q.prompt}
            </p>
            {q.type === 'multiple' && q.options && (
              <ul className="mt-2 ml-4 space-y-1">
                {q.options.map((o, k) => (
                  <li key={o}>
                    {'ABCD'.charAt(k)}) {o}
                  </li>
                ))}
              </ul>
            )}
            {q.type === 'match' && q.pairs && (
              <div className="mt-2 ml-4 space-y-2">
                <ul className="space-y-1">
                  {q.pairs.map(([a]) => (
                    <li key={a}>{a} → ______________________________</li>
                  ))}
                </ul>
                <p className="text-xs text-slate-500">
                  {tr('Opções para relacionar:')} {[...q.pairs.map(([, b]) => b)].sort().join(' · ')}
                </p>
              </div>
            )}
            {q.type === 'short' && (
              <div className="mt-2 ml-4">{tr('Resposta')}: ______________________________</div>
            )}
          </li>
        ))}
      </ol>

      <h2 className="text-xl font-extrabold mt-10 mb-3">{tr('Gabarito')}</h2>
      <ol className="space-y-2">
        {questions.map((q, i) => (
          <li key={q.id}>
            {i + 1}. {q.type === 'match' ? (q.pairs ?? []).map((p) => p.join(' → ')).join(' · ') : q.answer}
          </li>
        ))}
      </ol>
    </div>
  );
}
