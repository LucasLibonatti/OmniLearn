import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string;

if (!url || !key) {
  const missing = [!url && 'VITE_SUPABASE_URL', !key && 'VITE_SUPABASE_ANON_KEY (ou VITE_SUPABASE_PUBLISHABLE_KEY)']
    .filter(Boolean)
    .join(', ');
  document.getElementById('root')!.innerHTML =
    `<div style="font-family:system-ui;padding:24px;color:#b91c1c">` +
    `<h1 style="font-size:18px">Configuração ausente</h1>` +
    `<p>Defina no Vercel as variáveis: <b>${missing}</b>.</p></div>`;
  throw new Error(`Variáveis de ambiente ausentes: ${missing}`);
}

export const supabase = createClient(url, key);