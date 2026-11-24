import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Btn, Card } from '../ui';
import { EmptyState, ErrorState, Spinner } from '../components/states';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../i18n';
import { getSubject } from '../services/subjects';
import { countQuestions } from '../services/questions';
import { startSession } from '../services/sessions';

export default function Configure() {
  const { tr } = useI18n();
  const { subjectId } = useParams();
  const nav2 = useNavigate();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [exam, setExam] = useState(false);
  const data = useAsync(async () => {
    if (!subjectId) return null;
    const [subject, questions] = await Promise.all([getSubject(subjectId), countQuestions(subjectId)]);
    return { subject, questions };
  }, [subjectId]);

  const planned = Math.min(18, data.data?.questions ?? 0);

  const start = async () => {
    if (!subjectId || !planned || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const id = await startSession({ subjectId, mode: 'smart', planned });
      nav2(`/sessao/${id}${exam ? '?exam=1' : ''}`);
    } catch (e) {
      setMsg(tr('Erro: {msg}', { msg: (e as Error).message }));
      setBusy(false);
    }
  };

  if (data.loading) return <Spinner label={tr('Preparando…')} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data?.subject) {
    return <EmptyState title={tr('Matéria não encontrada')} action={<Btn to="/materias">{tr('Voltar')}</Btn>} />;
  }

  const { subject, questions } = data.data;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-extrabold">{tr('Prepare sua sessão')}</h1>
      <Card className="divide-y divide-slate-100">
        {[
          [tr('Matéria'), subject.name],
          [tr('Conteúdo'), subject.topic || subject.name],
          [tr('Tempo'), tr('15 minutos')],
          [tr('Quantidade estimada'), questions ? tr('{n} questões', { n: planned }) : tr('Nenhuma questão ainda')],
        ].map(([a, b]) => (
          <div key={a} className="flex justify-between py-3">
            <span className="text-slate-500">{a}</span>
            <span className="font-semibold text-right">{b}</span>
          </div>
        ))}
      </Card>
      <Card className="bg-indigo-50 border-indigo-100">
        <p className="font-bold">{tr('Aprendizado inteligente')}</p>
        <p className="text-sm text-slate-600">{tr('As perguntas serão adaptadas ao seu desempenho.')}</p>
      </Card>
      <Card>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={exam}
            onChange={(e) => setExam(e.target.checked)}
            className="mt-1 w-5 h-5 accent-indigo-600"
          />
          <div>
            <p className="font-bold inline-flex items-center gap-1.5">
              <GraduationCap size={18} className="text-indigo-600" />
              {tr('Modo prova')}
            </p>
            <p className="text-sm text-slate-600">
              {tr('No modo prova você responde sem ver se acertou, como uma prova de verdade. O resultado aparece só no final.')}
            </p>
          </div>
        </label>
      </Card>
      {questions === 0 && (
        <p className="text-sm text-amber-700">
          {tr('Esta matéria ainda não tem questões. Adicione material e gere as questões primeiro.')}
        </p>
      )}
      {msg && <p className="text-sm font-medium text-red-600">{msg}</p>}
      <Btn disabled={planned === 0 || busy} onClick={() => void start()}>
        {busy ? tr('Começando…') : tr('Começar sessão')}
      </Btn>
    </div>
  );
}
