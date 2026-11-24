import { api } from '../lib/api';

/** Exclui a conta e todos os dados do usuário no servidor (LGPD Art. 18, VI). */
export async function deleteAccount(): Promise<void> {
  await api('/api/account', { method: 'DELETE' });
}

/** Exporta todos os dados pessoais do titular em JSON estruturado (LGPD Art. 18, II e V). */
export async function exportMyData(): Promise<void> {
  const payload = await api<Record<string, unknown>>('/api/account/export');
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `omnilearn-meus-dados-${today}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
