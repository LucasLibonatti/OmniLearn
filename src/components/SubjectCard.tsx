import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Pencil, Trash2 } from 'lucide-react';
import { Bar, Btn, Card } from '../ui';
import { Icon, flameFor } from '../icons';
import { confirmDialog } from './confirm';
import { toast } from './Toast';
import { useI18n } from '../i18n';
import { useAppData } from '../context/AppDataContext';
import { archiveSubject, deleteSubject, renameSubject, unarchiveSubject } from '../services/subjects';
import { shortAgo } from '../lib/dates';
import type { SubjectWithStats } from '../types';

export function SubjectCard({
  s,
  manage = false,
  archived = false,
  onChanged,
}: {
  s: SubjectWithStats;
  manage?: boolean;
  archived?: boolean;
  onChanged?: () => void;
}) {
  const { tr } = useI18n();
  const { reloadAllSubjects } = useAppData();
  const nav2 = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(s.name);
  const [busy, setBusy] = useState(false);
  const open = () => nav2(`/materias/${s.id}`);

  const notify = () => {
    void reloadAllSubjects();
    onChanged?.();
  };

  const save = async () => {
    if (!name.trim() || name === s.name) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await renameSubject(s.id, name.trim());
      setEditing(false);
      notify();
      toast.success(tr('Matéria renomeada!'));
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    const ok = await confirmDialog({
      title: tr('Arquivar matéria'),
      message: tr('Tem certeza que deseja arquivar a matéria "{name}"?', { name: s.name }),
      note: tr('Você poderá recuperá-la depois em "Arquivadas".'),
      confirmLabel: tr('Arquivar'),
    });
    if (!ok) return;
    setBusy(true);
    try {
      await archiveSubject(s.id);
      notify();
      toast.info(tr('Matéria arquivada.'));
    } finally {
      setBusy(false);
    }
  };

  const unarchive = async () => {
    setBusy(true);
    try {
      await unarchiveSubject(s.id);
      notify();
      toast.success(tr('Matéria reativada!'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await confirmDialog({
      title: tr('Excluir matéria'),
      message: tr('Tem certeza que deseja excluir a matéria "{name}"?', { name: s.name }),
      note: tr('Se você excluir, esta matéria será apagada para sempre, junto com as questões, materiais e arquivos enviados.'),
      confirmLabel: tr('Excluir'),
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await deleteSubject(s.id);
      notify();
      toast.info(tr('Matéria excluída.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition cursor-pointer" onClick={open}>
      <div className="flex justify-between items-start gap-2">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Enter' && void save()}
            className="rounded-xl border border-slate-200 px-3 py-1 text-sm font-bold"
            autoFocus
          />
        ) : (
          <span className={`rounded-xl px-3 py-1 text-sm font-bold ${s.tone ?? 'bg-slate-100 text-slate-700'}`}>{s.name}</span>
        )}
        <span className="inline-flex items-center gap-1 text-sm text-orange-500 font-semibold">
          <Icon name={flameFor(s.streak)} size={16} /> {s.streak}
        </span>
      </div>
      <h3 className="font-bold text-lg mt-3">{s.topic || s.name}</h3>
      <p className="text-sm text-slate-500">
        {tr('{n} questões', { n: s.questions })} · {tr('Última sessão')}: {shortAgo(s.last_session)}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1">
          <Bar v={s.progress} />
        </div>
        <span className="text-sm font-bold">{s.progress}%</span>
      </div>
      <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
        {archived ? (
          <>
            <Btn className="flex-1" onClick={unarchive} disabled={busy}>
              {tr('Reativar')}
            </Btn>
            <Btn v="s" onClick={remove} disabled={busy}>
              <Trash2 size={16} /> {tr('Excluir')}
            </Btn>
          </>
        ) : (
          <>
            <Btn className="flex-1" onClick={() => nav2(`/sessao/configurar/${s.id}`)} disabled={!s.questions}>
              {s.questions ? tr('Estudar') : tr('Sem questões')}
            </Btn>
            <Btn v="s" to={`/materias/${s.id}`}>
              {tr('Abrir')}
            </Btn>
          </>
        )}
      </div>
      {manage && !archived && (
        <div className="mt-2 flex justify-end items-center gap-1 text-slate-400" onClick={(e) => e.stopPropagation()}>
          {editing ? (
            <button onClick={save} disabled={busy} className="px-2 py-1 text-xs font-semibold text-indigo-600">
              {tr('Salvar')}
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="p-2 hover:text-indigo-600" aria-label={tr('Renomear')}>
              <Pencil size={16} />
            </button>
          )}
          <button onClick={archive} disabled={busy} className="p-2 hover:text-slate-700" aria-label={tr('Arquivar')}>
            <Archive size={16} />
          </button>
          <button onClick={remove} disabled={busy} className="p-2 hover:text-red-600" aria-label={tr('Excluir')}>
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </Card>
  );
}
