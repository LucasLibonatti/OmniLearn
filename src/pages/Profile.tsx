import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Download, Share2, Trash2 } from 'lucide-react';
import { Avatar, Bar, Btn, Card } from '../ui';
import { Icon, flameFor } from '../icons';
import { confirmDialog } from '../components/confirm';
import { useAuth } from '../auth';
import { useAsync } from '../hooks/useAsync';
import { useProfile, useSubjects } from '../hooks/useApp';
import { useAppData } from '../context/AppDataContext';
import { useSettings } from '../hooks/useSettings';
import { useI18n, type Lang } from '../i18n';
import { updateDailyGoal, updateProfileName, uploadAvatar } from '../services/profile';
import { deleteAccount, exportMyData } from '../services/account';
import * as statsApi from '../services/stats';
import { shareText } from '../lib/share';
import { xpInLevel, XP_PER_LEVEL } from '../engine/xp';

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition shrink-0 ${on ? 'bg-indigo-600' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'pt', label: 'Português (PT)' },
  { value: 'en', label: 'English (EN)' },
];

export default function Profile() {
  const { lang, setLang, tr } = useI18n();
  const { session, signOut } = useAuth();
  const userId = session?.user.id;
  const profile = useProfile();
  const { data: subjectsCached } = useSubjects();
  const { patchProfile } = useAppData();
  const { theme, sound, reminder, toggleTheme, toggleSound, toggleReminder } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [goalInput, setGoalInput] = useState<string | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const extra = useAsync(async () => {
    if (!userId) return null;
    const overview = await statsApi.statsOverview();
    return { answered: overview.answered, acc: overview.accuracy };
  }, [userId]);

  const p = profile.data;
  const displayName = p?.name ?? tr('Estudante');
  const xp = p?.xp ?? 0;

  const startEdit = () => {
    setName(displayName);
    setEditing(true);
  };

  const saveName = async () => {
    if (!userId || !name.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const trimmed = name.trim();
      await updateProfileName(trimmed);
      patchProfile({ name: trimmed });
      setEditing(false);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file || !userId) return;
    if (!/^image\//.test(file.type)) {
      setMsg(tr('Escolha um arquivo de imagem (JPG, PNG…).'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg(tr('A foto deve ter no máximo 5 MB.'));
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const avatarUrl = await uploadAvatar(file);
      patchProfile({ avatar_url: avatarUrl });
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const saveGoal = async () => {
    if (!userId) return;
    const n = parseInt(goalInput ?? String(p?.daily_goal ?? 18), 10);
    if (!n || n < 5 || n > 100) {
      setMsg(tr('Escolha uma meta entre 5 e 100 questões.'));
      return;
    }
    setSavingGoal(true);
    setMsg(null);
    try {
      await updateDailyGoal(n);
      patchProfile({ daily_goal: n });
      setGoalInput(null);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setSavingGoal(false);
    }
  };

  const downloadData = async () => {
    setExporting(true);
    setMsg(null);
    try {
      await exportMyData();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const removeAccount = async () => {
    const first = await confirmDialog({
      title: tr('Excluir conta'),
      message: tr('Tem certeza que deseja excluir sua conta e TODOS os seus dados?'),
      note: tr('Esta ação não pode ser desfeita.'),
      confirmLabel: tr('Continuar'),
      danger: true,
    });
    if (!first) return;
    const second = await confirmDialog({
      title: tr('Tem certeza absoluta?'),
      message: tr('Materiais, questões e histórico serão apagados permanentemente.'),
      note: tr('Não há como recuperar depois.'),
      confirmLabel: tr('Excluir tudo'),
      danger: true,
    });
    if (!second) return;
    setBusy(true);
    setMsg(null);
    try {
      await deleteAccount();
      await signOut();
    } catch (e) {
      setMsg((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-3xl font-extrabold">{tr('Meu perfil')}</h1>
      <Card className="text-center">
        <div className="relative w-24 h-24 mx-auto grid place-items-center">
          <Avatar name={displayName} src={profile.data?.avatar_url} size={96} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label={tr('Trocar foto')}
            className="absolute -bottom-1 -right-1 grid place-items-center w-9 h-9 rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-40"
          >
            <Camera size={17} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void pickPhoto(e.target.files?.[0])}
          />
        </div>
        {uploading && <p className="text-xs text-slate-500 mt-2">{tr('Enviando foto…')}</p>}
        {editing ? (
          <div className="mt-3 flex items-center justify-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void saveName()}
              className="rounded-2xl border border-slate-200 px-4 py-2"
              autoFocus
            />
            <Btn onClick={() => void saveName()} disabled={busy}>
              {tr('Salvar')}
            </Btn>
          </div>
        ) : (
          <h2 className="text-xl font-bold mt-3">{displayName}</h2>
        )}
        <p className="text-slate-600">{tr('Nível {n}', { n: p?.level ?? 1 })}</p>
        <div className="mt-3">
          <Bar v={(xpInLevel(xp) / XP_PER_LEVEL) * 100} color="bg-amber-400" />
        </div>
        <p className="text-sm text-slate-500 mt-1">
          XP: {xpInLevel(xp)} / {XP_PER_LEVEL}
        </p>
        <p className="mt-2 font-semibold inline-flex items-center gap-1.5">
          <Icon name={flameFor(p?.streak ?? 0)} size={20} /> {tr('Sequência')}: {tr('{n} dias', { n: p?.streak ?? 0 })}
        </p>
      </Card>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          [extra.data?.answered ?? 0, tr('questões')],
          [`${extra.data?.acc ?? 0}%`, tr('acerto')],
          [subjectsCached?.length ?? 0, tr('matérias')],
        ].map(([v, l]) => (
          <Card key={l}>
            <p className="text-xl font-extrabold">{v}</p>
            <p className="text-xs text-slate-500">{l}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-bold mb-1">{tr('Preferências')}</h2>
        <div className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="font-medium">{tr('Idioma da interface (Language)')}</p>
            <p className="text-sm text-slate-500">{tr('Escolha entre Português e Inglês.')}</p>
          </div>
          <div
            role="group"
            aria-label={tr('Idioma da interface')}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-2xl border border-slate-200 bg-white p-1"
          >
            {LANG_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={lang === o.value}
                onClick={() => setLang(o.value)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  lang === o.value ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
            <p className="font-medium">{tr('Tema escuro')}</p>
            <p className="text-sm text-slate-500">{tr('Melhor para estudar à noite.')}</p>
          </div>
          <Switch on={theme === 'dark'} onChange={toggleTheme} label={tr('Tema escuro')} />
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
            <p className="font-medium">{tr('Sons ao responder')}</p>
            <p className="text-sm text-slate-500">{tr('Um "plim" no acerto e um "tadam" no erro.')}</p>
          </div>
          <Switch on={sound} onChange={toggleSound} label={tr('Sons ao responder')} />
        </div>
        <div className="py-3 border-t border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{tr('Meta diária de questões')}</p>
              <p className="text-sm text-slate-500">{tr('Quantas questões você quer resolver por dia?')}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={5}
                max={100}
                value={goalInput ?? String(p?.daily_goal ?? 18)}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-center"
              />
              <Btn v="s" onClick={() => void saveGoal()} disabled={savingGoal}>
                {savingGoal ? tr('…') : tr('Salvar')}
              </Btn>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
            <p className="font-medium">{tr('Lembrete diário')}</p>
            <p className="text-sm text-slate-500">{tr('Aviso às 19h se você ainda não bateu a meta.')}</p>
          </div>
          <Switch on={reminder} onChange={() => void toggleReminder()} label={tr('Lembrete diário')} />
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
            <p className="font-medium">{tr('Suporte')}</p>
            <p className="text-sm text-slate-500">{tr('Precisa de ajuda? Fale com a gente.')}</p>
          </div>
          <Link to="/suporte" className="text-indigo-600 font-semibold text-sm">
            {tr('Abrir')}
          </Link>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
            <p className="font-medium">{tr('Diretrizes e termos')}</p>
            <p className="text-sm text-slate-500">{tr('Termos de uso, privacidade e LGPD.')}</p>
          </div>
          <Link to="/diretrizes" className="font-semibold text-indigo-600">
            {tr('Ver')}
          </Link>
        </div>
      </Card>

      {msg && <p className="text-sm font-medium text-red-600">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        {!editing && (
          <Btn v="s" onClick={startEdit}>
            {tr('Editar perfil')}
          </Btn>
        )}
        <Btn
          v="s"
          onClick={() =>
            shareText(
              tr('Estou usando o OmniLearn! ✨ Sequência de {n} dias, nível {level} e {q} questões respondidas. 🚀', {
                n: p?.streak ?? 0,
                level: p?.level ?? 1,
                q: extra.data?.answered ?? 0,
              }),
            )
          }
        >
          <Share2 size={16} />
          {tr('Compartilhar')}
        </Btn>
        <Btn v="s" onClick={() => void downloadData()} disabled={exporting || busy}>
          <Download size={16} /> {exporting ? tr('Exportando…') : tr('Baixar meus dados (JSON)')}
        </Btn>
        <Btn v="s" onClick={() => void removeAccount()} disabled={busy}>
          <Trash2 size={16} /> {tr('Excluir minha conta e meus dados')}
        </Btn>
      </div>
    </div>
  );
}
