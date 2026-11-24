import { api } from '../lib/api';
import type { Profile } from '../types';

export async function getProfile(): Promise<Profile | null> {
  return api<Profile | null>('/api/profile');
}

export async function updateProfileName(name: string): Promise<void> {
  await api('/api/profile', { method: 'PATCH', body: { name } });
}

export async function updateDailyGoal(goal: number): Promise<void> {
  await api('/api/profile', { method: 'PATCH', body: { daily_goal: goal } });
}

export async function acceptConsent(version: string): Promise<Profile | null> {
  return api<Profile | null>('/api/profile/consent', { method: 'POST', body: { version } });
}

/** Redimensiona e comprime a foto para 256×256 WebP no navegador (~10–15 kB) antes de enviar. */
function compressAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas indisponível.');
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/webp', 0.82);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem selecionada.'));
    };
    img.src = url;
  });
}

export async function uploadAvatar(file: File): Promise<string> {
  const dataUrl = await compressAvatar(file);
  const res = await api<{ avatar_url: string }>('/api/profile/avatar', {
    method: 'POST',
    body: { dataUrl },
  });
  return res.avatar_url;
}
