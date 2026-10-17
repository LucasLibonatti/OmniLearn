import { Instagram, Youtube, Music2, Twitter } from 'lucide-react';

// TODO: troque os '#' pelos links reais das redes sociais do OmniLearn.
const REDES = [
  { nome: 'Instagram', href: '#', Icone: Instagram },
  { nome: 'TikTok', href: '#', Icone: Music2 },
  { nome: 'YouTube', href: '#', Icone: Youtube },
  { nome: 'X', href: '#', Icone: Twitter },
];

export function Socials({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      {REDES.map(({ nome, href, Icone }) => (
        <a
          key={nome}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={nome}
          className="group inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md"
        >
          <Icone size={18} />
          {nome}
        </a>
      ))}
    </div>
  );
}
