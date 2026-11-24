import { api } from '../lib/api';
import type { Material } from '../types';

export async function listMaterials(subjectId: string): Promise<Material[]> {
  return api<Material[]>(`/api/subjects/${encodeURIComponent(subjectId)}/materials`);
}

export async function countMaterials(subjectId: string): Promise<number> {
  const list = await listMaterials(subjectId);
  return list.length;
}

/**
 * Salva apenas os metadados e o texto extraído localmente no navegador (nunca sobe binário PDF/PPTX).
 */
export async function saveMaterial(
  subjectId: string,
  input: { fileName: string; pages: number; extractedText: string },
): Promise<Material> {
  return api<Material>(`/api/subjects/${encodeURIComponent(subjectId)}/materials`, {
    method: 'POST',
    body: {
      file_name: input.fileName,
      pages: input.pages,
      extracted_text: input.extractedText,
    },
  });
}
