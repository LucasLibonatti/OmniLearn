import { useState, type DragEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, FileText, Layers, Paperclip, PenLine, Sparkles, Trash2, Upload } from 'lucide-react';
import { Btn, Card } from '../ui';
import { Generating, Spinner } from '../components/states';
import { useAuth } from '../auth';
import { useAsync } from '../hooks/useAsync';
import { useAppData } from '../context/AppDataContext';
import { useI18n } from '../i18n';
import { createSubject, getSubject } from '../services/subjects';
import { countMaterials, saveMaterial } from '../services/materials';
import { generateQuestions } from '../services/generation';
import { extractText, inspectAndExtractFile, MAX_PDF_PAGES, MAX_PPTX_SLIDES } from '../lib/extract';
import { detectSensitivePii } from '../lib/piiCheck';

interface SelectedFileInfo {
  file: File;
  status: 'idle' | 'reading' | 'ready' | 'error';
  pageCount?: number;
  extractedText?: string;
  errorMsg?: string;
}

interface Entry {
  name: string;
  status: 'pending' | 'uploading' | 'reading' | 'ready' | 'error';
  msg?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewSubject() {
  const { t, tr } = useI18n();
  const [params] = useSearchParams();
  const existingId = params.get('subject');
  const nav2 = useNavigate();
  const { session } = useAuth();
  const { reloadAllSubjects } = useAppData();
  const userId = session?.user.id;

  const existing = useAsync(() => (existingId ? getSubject(existingId) : Promise.resolve(null)), [existingId]);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [genStart, setGenStart] = useState<number | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [pasted, setPasted] = useState('');
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  const subjectId = existingId ?? created;

  const add = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const f = list[0];
    if (!f) return;
    if (!/\.(pdf|pptx)$/i.test(f.name)) {
      setStatus(tr('{name}: só aceitamos PDF e PPTX', { name: f.name }));
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setStatus(tr('{name}: maior que 20 MB', { name: f.name }));
      return;
    }
    setStatus('');
    setSelectedFile({ file: f, status: 'reading' });
    try {
      const inspection = await inspectAndExtractFile(f);
      if (inspection.error) {
        setSelectedFile({ file: f, status: 'error', errorMsg: inspection.error, pageCount: inspection.pageCount });
      } else {
        setSelectedFile({ file: f, status: 'ready', pageCount: inspection.pageCount, extractedText: inspection.text });
      }
    } catch {
      setSelectedFile({ file: f, status: 'ready' });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setStatus('');
  };

  const updateEntry = (i: number, patch: Partial<Entry>) =>
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  const run = async () => {
    if (!userId || busy) return;
    setBusy(true);
    setStatus('');
    let sid = subjectId;
    try {
      if (!sid) {
        if (!name.trim()) throw new Error(tr('Dê um nome para a matéria.'));
        setStatus(tr('Criando matéria…'));
        const s = await createSubject(name.trim(), topic.trim() || null);
        sid = s.id;
        setCreated(s.id);
      }
      if (!sid) throw new Error(tr('Não foi possível criar a matéria.'));
      const already = await countMaterials(sid);
      const incoming = mode === 'text' ? 1 : selectedFile ? 1 : 0;
      if (already + incoming > 1) {
        throw new Error(tr('Cada matéria aceita apenas 1 arquivo por vez. Remova o material anterior primeiro.'));
      }
      if (incoming === 0 && already === 0) throw new Error(tr('Envie um arquivo ou cole um texto.'));

      if (mode === 'text') {
        const cleanText = pasted.trim();
        if (cleanText.length < 200) throw new Error(tr('Cole um texto maior (pelo menos 200 caracteres).'));
        if (detectSensitivePii(cleanText)) {
          throw new Error(
            tr(
              'Detectamos possíveis dados sensíveis (CPF ou número de cartão) no conteúdo. Remova essas informações pessoais antes de enviar para a IA.',
            ),
          );
        }
        setStatus(tr('Salvando o texto…'));
        await saveMaterial(sid, {
          fileName: name.trim() || tr('Texto colado'),
          pages: 1,
          extractedText: cleanText,
        });
      } else {
        if (!selectedFile?.file) throw new Error(tr('Selecione um arquivo.'));
        if (selectedFile.status === 'error') throw new Error(selectedFile.errorMsg || tr('Arquivo inválido.'));
        const file = selectedFile.file;
        setEntries([{ name: file.name, status: 'reading' }]);
        const ex = selectedFile.extractedText
          ? { text: selectedFile.extractedText, pages: selectedFile.pageCount ?? 1, empty: selectedFile.extractedText.length < 200 }
          : await extractText(file);
        if (ex.empty) {
          updateEntry(0, { status: 'error', msg: tr('Sem texto legível') });
          throw new Error(tr('Não conseguimos ler texto suficiente neste arquivo (pode ser escaneado ou só com imagens).'));
        }
        if (detectSensitivePii(ex.text)) {
          updateEntry(0, { status: 'error', msg: tr('Dados sensíveis detectados') });
          throw new Error(
            tr(
              'Detectamos possíveis dados sensíveis (CPF ou número de cartão) no conteúdo. Remova essas informações pessoais antes de enviar para a IA.',
            ),
          );
        }
        updateEntry(0, { status: 'uploading' });
        await saveMaterial(sid, {
          fileName: file.name,
          pages: ex.pages,
          extractedText: ex.text,
        });
        updateEntry(0, { status: 'ready' });
      }

      setStatus(tr('Gerando questões com a IA…'));
      setGenStart(Date.now());
      const res = await generateQuestions(sid);
      setStatus(tr('Tudo pronto! {n} questões geradas.', { n: res.inserted }));
      void reloadAllSubjects();
      nav2(`/sessao/configurar/${sid}`);
    } catch (e) {
      setGenStart(null);
      setBusy(false);
      setStatus(tr('Erro: {msg}', { msg: (e as Error).message }));
      void reloadAllSubjects();
    }
  };

  if (existingId && existing.loading) return <Spinner label={tr('Carregando matéria…')} />;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-extrabold">
        {existingId ? tr('Adicionar material a {name}', { name: existing.data?.name ?? '' }) : tr('Crie uma nova matéria')}
      </h1>

      {!existingId && (
        <>
          <label className="block">
            <span className="font-semibold">{tr('Nome da matéria')}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr('História — Revolução Francesa')}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white"
            />
          </label>
          <label className="block">
            <span className="font-semibold">{tr('Assunto (opcional)')}</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={tr('Ex.: Revolução Francesa')}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white"
            />
          </label>
        </>
      )}

      <h2 className="font-bold text-lg">{tr('Adicione seu material')}</h2>
      <div className="flex gap-2">
        {(['file', 'text'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold border-2 transition ${mode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
          >
            {m === 'file' ? <Paperclip size={17} /> : <PenLine size={17} />}
            {m === 'file' ? tr('Enviar arquivo') : tr('Colar texto')}
          </button>
        ))}
      </div>

      {/* Aviso em camadas (LGPD) */}
      <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 flex items-start gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden />
        <div className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
          <p className="font-bold">
            {t('upload.warning.title')}{' '}
            <span className="font-medium text-amber-800 dark:text-amber-200/90">— {t('upload.warning.short')}</span>{' '}
            <button
              type="button"
              onClick={() => setShowPrivacyInfo((v) => !v)}
              aria-expanded={showPrivacyInfo}
              className="font-extrabold underline decoration-amber-500/70 underline-offset-2 text-amber-900 dark:text-amber-300 hover:opacity-80 cursor-pointer"
            >
              {showPrivacyInfo ? t('upload.warning.less') : t('upload.warning.more')}
            </button>
          </p>
          {showPrivacyInfo && (
            <div className="mt-2 pt-2 border-t border-amber-200/80 dark:border-amber-500/25 text-xs font-medium text-amber-900/90 dark:text-amber-200/90 space-y-1.5 fade">
              <p>{t('upload.warning.details')}</p>
              <Link
                to="/diretrizes"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-extrabold underline text-amber-950 dark:text-amber-300"
              >
                {t('upload.warning.link')} →
              </Link>
            </div>
          )}
        </div>
      </div>

      {mode === 'file' ? (
        <>
          {!selectedFile && (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e: DragEvent) => {
                e.preventDefault();
                void add(e.dataTransfer.files);
              }}
              className="block cursor-pointer rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-10 text-center hover:bg-indigo-50 focus-within:outline-2"
            >
              <Upload className="mx-auto text-indigo-600" size={32} />
              <p className="font-bold mt-3">{tr('Arraste seu arquivo aqui')}</p>
              <p className="text-sm text-slate-500">{tr('ou clique para selecionar')}</p>
              <p className="text-xs text-slate-400 mt-2">
                {tr('1 arquivo por vez · PDF (máx. {maxPdf} págs) ou PPTX (máx. {maxPptx} slides) · até 20 MB', {
                  maxPdf: MAX_PDF_PAGES,
                  maxPptx: MAX_PPTX_SLIDES,
                })}
              </p>
              <input type="file" accept=".pdf,.pptx" className="sr-only" onChange={(e) => void add(e.target.files)} />
            </label>
          )}

          {selectedFile && (
            <Card
              className={`flex items-start gap-4 pop border-2 ${
                selectedFile.status === 'error'
                  ? 'border-red-300 bg-red-50'
                  : selectedFile.status === 'reading'
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-emerald-200 bg-emerald-50/50'
              }`}
            >
              <div className="shrink-0 mt-0.5 relative">
                {selectedFile.file.name.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-12 h-14 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="text-red-600" size={24} />
                  </div>
                ) : (
                  <div className="w-12 h-14 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Layers className="text-orange-600" size={24} />
                  </div>
                )}
                {selectedFile.status === 'ready' && (
                  <span className="absolute -top-2 -right-2 grid place-items-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    ✓
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-base truncate">{selectedFile.file.name}</p>
                  {selectedFile.status === 'ready' && (
                    <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {tr('Arquivo anexado ✓')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-0.5">
                  {formatFileSize(selectedFile.file.size)}
                  {selectedFile.pageCount != null && selectedFile.pageCount > 0 && (
                    <>
                      {' '}
                      ·{' '}
                      {selectedFile.file.name.toLowerCase().endsWith('.pdf')
                        ? tr('{n} páginas', { n: selectedFile.pageCount })
                        : tr('{n} slides', { n: selectedFile.pageCount })}
                    </>
                  )}
                  {selectedFile.status === 'ready' && ' · ' + tr('Pronto para gerar')}
                </p>
                {selectedFile.status === 'reading' && (
                  <p className="text-xs font-semibold text-amber-600 mt-1">{tr('Lendo arquivo…')}</p>
                )}
                {selectedFile.status === 'error' && selectedFile.errorMsg && (
                  <p className="text-xs font-semibold text-red-600 mt-1">{selectedFile.errorMsg}</p>
                )}
              </div>
              <button
                onClick={removeFile}
                className="shrink-0 p-2 rounded-xl hover:bg-white/60 text-slate-400 hover:text-red-500 transition"
                aria-label={tr('Remover arquivo')}
                title={tr('Remover / Trocar arquivo')}
              >
                <Trash2 size={18} />
              </button>
            </Card>
          )}
        </>
      ) : (
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={8}
          placeholder={tr('Cole aqui o texto do seu material (resumo, anotação, capítulo…).')}
          className="w-full rounded-3xl border-2 border-slate-200 px-4 py-4 bg-white"
        />
      )}

      {entries.map((e, i) => (
        <Card key={i} className="flex items-center gap-3 pop">
          <FileText className="text-indigo-600 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold truncate">{e.name}</p>
            {e.msg && <p className="text-sm text-red-500">{e.msg}</p>}
          </div>
          <span
            className={`ml-auto text-sm font-semibold shrink-0 ${e.status === 'ready' ? 'text-emerald-600' : e.status === 'error' ? 'text-red-500' : 'text-slate-500'}`}
          >
            {e.status === 'pending' && tr('Na fila')}
            {e.status === 'uploading' && tr('Enviando…')}
            {e.status === 'reading' && tr('Lendo…')}
            {e.status === 'ready' && tr('✓ Pronto')}
            {e.status === 'error' && tr('✕ Erro')}
          </span>
        </Card>
      ))}

      {genStart !== null ? (
        <Generating label={tr('Gerando questões com a IA…')} startedAt={genStart} />
      ) : (
        status && <p className="text-sm font-medium text-slate-600">{status}</p>
      )}

      <Btn
        disabled={(mode === 'text' ? pasted.trim().length < 200 : !selectedFile || selectedFile.status !== 'ready') || busy}
        onClick={() => void run()}
      >
        <Sparkles size={18} />
        {busy ? tr('Processando…') : existingId ? tr('Adicionar e gerar questões') : tr('Criar minha sessão')}
      </Btn>
      {!busy && status.startsWith(tr('Erro')) && subjectId && (
        <Btn v="s" to={`/materias/${subjectId}`}>
          {tr('Ir para a matéria e tentar de novo')}
        </Btn>
      )}
    </div>
  );
}
