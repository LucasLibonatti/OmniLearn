import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Layers, Printer, Share2, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Bar, Btn, Card } from '../ui';
import { Icon } from '../icons';
import { EmptyState, ErrorState, Generating, Spinner } from '../components/states';
import { toast } from '../components/Toast';
import { useAuth } from '../auth';
import { useAsync } from '../hooks/useAsync';
import { useAppData } from '../context/AppDataContext';
import { useI18n } from '../i18n';
import { getSubjectDetail } from '../services/subjects';
import { generateQuestions } from '../services/generation';
import { summarizeSubject } from '../services/ai';
import { shareText } from '../lib/share';
import type { Material } from '../types';

export default function SubjectPage() {
  const { tr } = useI18n();
  const { id } = useParams();
  const { session } = useAuth();
  const { reloadAllSubjects } = useAppData();
  const userId = session?.user.id;
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);
  const [genStart, setGenStart] = useState<number | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [sumBusy, setSumBusy] = useState(false);
  const [sumErr, setSumErr] = useState<string | null>(null);
  const [sumStart, setSumStart] = useState<number | null>(null);

  const data = useAsync(async () => {
    if (!id) return null;
    return getSubjectDetail(id);
  }, [id, userId]);

  const generate = async () => {
    if (!id) return;
    setGenerating(true);
    setGenMsg(null);
    setGenStart(Date.now());
    try {
      const res = await generateQuestions(id);
      const msg = tr('Pronto! {n} questões geradas.', { n: res.inserted });
      setGenMsg(msg);
      toast.success(msg);
      data.reload();
      void reloadAllSubjects();
    } catch (e) {
      setGenMsg(tr('Erro: {msg}', { msg: (e as Error).message }));
    } finally {
      setGenerating(false);
      setGenStart(null);
    }
  };

  const doSummary = async () => {
    if (!id) return;
    setSumBusy(true);
    setSumErr(null);
    setSummary(null);
    setSumStart(Date.now());
    try {
      setSummary(await summarizeSubject(id));
    } catch (e) {
      setSumErr((e as Error).message);
    } finally {
      setSumBusy(false);
      setSumStart(null);
    }
  };

  if (data.loading) return <Spinner label={tr('Carregando matéria…')} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data?.subject) {
    return <EmptyState title={tr('Matéria não encontrada')} action={<Btn to="/materias">{tr('Voltar')}</Btn>} />;
  }

  const { subject, questions, materials, stats, topics } = data.data;
  const status = (m: Material) =>
    m.status === 'ready'
      ? { text: tr('✓ Pronto'), cls: 'text-emerald-600' }
      : m.status === 'error'
        ? { text: tr('Erro'), cls: 'text-red-500' }
        : m.status === 'generating'
          ? { text: tr('Gerando…'), cls: 'text-amber-600' }
          : m.status === 'extracted'
            ? { text: tr('Texto lido'), cls: 'text-slate-500' }
            : { text: tr('Enviado'), cls: 'text-slate-500' };

  return (
    <div className="space-y-6">
      <div>
        <span className={`rounded-xl px-3 py-1 text-sm font-bold ${subject.tone ?? 'bg-slate-100 text-slate-700'}`}>
          {subject.name}
        </span>
        <h1 className="text-3xl font-extrabold mt-3">{subject.topic || subject.name}</h1>
        <p className="text-slate-600">
          {tr('{n} questões', { n: questions })} · {tr('{n} respondidas', { n: stats?.answered ?? 0 })} ·{' '}
          {tr('{n} dias de atividade', { n: stats?.streak ?? 0 })}
        </p>
      </div>

      <Card>
        <div className="flex justify-between font-bold">
          <span>{tr('Domínio')}</span>
          <span>{stats?.accuracy ?? 0}%</span>
        </div>
        <div className="mt-2">
          <Bar v={stats?.progress ?? 0} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Btn to={`/sessao/configurar/${subject.id}`} disabled={questions === 0}>
            {tr('Estudar agora')}
          </Btn>
          <Btn v="s" to={`/materias/nova?subject=${subject.id}`} disabled={materials.length >= 1}>
            {tr('Adicionar material')}
          </Btn>
          <Btn v="s" onClick={generate} disabled={generating || sumBusy || materials.length === 0}>
            <Sparkles size={16} />
            {generating ? tr('Gerando…') : tr('Gerar mais questões')}
          </Btn>
          <Btn v="s" onClick={doSummary} disabled={sumBusy || generating || materials.length === 0}>
            <Sparkles size={16} />
            {sumBusy ? tr('Resumindo…') : tr('Resumo com IA')}
          </Btn>
          <Btn v="s" to={`/materias/${subject.id}/flashcards`} disabled={questions === 0}>
            <Layers size={16} />
            {tr('Flashcards')}
          </Btn>
          <Btn v="s" to={`/materias/${subject.id}/imprimir`} disabled={questions === 0}>
            <Printer size={16} />
            {tr('Imprimir')}
          </Btn>
          <Btn
            v="s"
            onClick={async () => {
              const res = await shareText(
                tr('Estou estudando {topic} no OmniLearn! {n} questões e {pct}% de acerto. 📚', {
                  topic: subject.topic || subject.name,
                  n: questions,
                  pct: stats?.accuracy ?? 0,
                }),
              );
              if (res === 'copied') toast.info(tr('Copiado para a área de transferência!'));
            }}
          >
            <Share2 size={16} />
            {tr('Compartilhar')}
          </Btn>
        </div>
        {genMsg && !generating && <p className="text-sm mt-3 font-medium text-slate-600">{genMsg}</p>}
      </Card>

      {generating && genStart !== null && <Generating label={tr('Gerando questões com a IA…')} startedAt={genStart} />}
      {sumBusy && sumStart !== null && <Generating label={tr('Resumindo seus materiais com a IA…')} startedAt={sumStart} />}

      {(summary || sumErr) && !sumBusy && (
        <Card className="bg-indigo-50 border-indigo-100">
          <h2 className="font-bold mb-2 inline-flex items-center gap-2">
            <Icon name="estrela" size={22} /> {tr('Resumo da IA')}
          </h2>
          {sumErr && <p className="text-sm text-red-600">{sumErr}</p>}
          {summary && (
            <p
              className="text-sm text-slate-700 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(summary, { ALLOWED_TAGS: ['strong'] }) }}
            />
          )}
        </Card>
      )}

      <Card>
        <h2 className="font-bold mb-3">{tr('Materiais')}</h2>
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500">{tr('Nenhum material enviado ainda.')}</p>
        ) : (
          <div className="space-y-3">
            {materials.map((m) => {
              const st = status(m);
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <FileText className="text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.file_name}</p>
                    <p className="text-sm text-slate-500">{tr('{n} páginas', { n: m.pages || '—' })}</p>
                    {m.status === 'error' && m.error_message && <p className="text-xs text-red-500">{m.error_message}</p>}
                  </div>
                  <span className={`ml-auto text-sm font-semibold shrink-0 ${st.cls}`}>{st.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {topics.length > 0 && (
        <Card>
          <h2 className="font-bold mb-3">{tr('Desempenho por assunto')}</h2>
          <div className="space-y-3">
            {topics.map((t) => (
              <div key={t.topic}>
                <div className="flex justify-between text-sm font-semibold">
                  <span>{t.topic}</span>
                  <span>{t.pct}%</span>
                </div>
                <Bar v={t.pct} color={t.pct >= 85 ? 'bg-emerald-500' : t.pct >= 70 ? 'bg-amber-500' : 'bg-red-400'} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
