import { supabase } from '../lib/supabase';
import type { Material, MaterialStatus } from '../types';
import type { MaterialRow } from '../types/database';

function toMaterial(r: MaterialRow): Material {
  return {
    id: r.id,
    user_id: r.user_id,
    subject_id: r.subject_id,
    file_name: r.file_name,
    storage_path: r.storage_path,
    pages: r.pages ?? 0,
    status: r.status as MaterialStatus,
    error_message: r.error_message,
    created_at: r.created_at ?? '',
  };
}

export function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.\-]+/g, '_')
    .slice(0, 120);
}

export async function listMaterials(subjectId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as MaterialRow[]).map(toMaterial);
}

export async function countMaterials(subjectId: string): Promise<number> {
  const { count, error } = await supabase
    .from('materials')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subjectId);
  if (error) throw error;
  return count ?? 0;
}

export async function uploadMaterial(userId: string, subjectId: string, file: File): Promise<Material> {
  const path = `${userId}/${subjectId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const up = await supabase.storage.from('materials').upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (up.error) throw up.error;
  const { data, error } = await supabase
    .from('materials')
    .insert({
      user_id: userId,
      subject_id: subjectId,
      file_name: file.name,
      storage_path: path,
      pages: 0,
      status: 'uploaded',
    })
    .select('*')
    .single();
  if (error) {
    await supabase.storage.from('materials').remove([path]);
    throw error;
  }
  return toMaterial(data as MaterialRow);
}

/** Cria um material a partir de texto colado (sem upload de arquivo). */
export async function createTextMaterial(userId: string, subjectId: string, text: string, name = 'Texto colado'): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .insert({
      user_id: userId,
      subject_id: subjectId,
      file_name: name,
      storage_path: '',
      pages: 1,
      status: 'extracted',
      extracted_text: text,
      char_count: text.length,
    })
    .select('*')
    .single();
  if (error) throw error;
  return toMaterial(data as MaterialRow);
}

export async function setMaterialExtracted(id: string, pages: number, text: string): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .update({ status: 'extracted', pages, extracted_text: text, char_count: text.length, error_message: null })
    .eq('id', id);
  if (error) throw error;
}

export async function setMaterialError(id: string, message: string): Promise<void> {
  const { error } = await supabase.from('materials').update({ status: 'error', error_message: message }).eq('id', id);
  if (error) throw error;
}

export async function deleteMaterial(material: Material): Promise<void> {
  if (material.storage_path) await supabase.storage.from('materials').remove([material.storage_path]);
  const { error } = await supabase.from('materials').delete().eq('id', material.id);
  if (error) throw error;
}
