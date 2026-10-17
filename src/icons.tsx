// Ícones 3D do OmniLearn (https://3dicons.co). As imagens ficam na pasta /Icons na raiz do projeto.
import type { CSSProperties } from 'react';
import heroi from '../Icons/Heroi.png';
import trofeu from '../Icons/Trofeu.png';
import livro from '../Icons/Livro.png';
import foguete from '../Icons/foguete.png';
import raio from '../Icons/raio.png';
import coroa from '../Icons/3dicons-crown-front-color.png';
import estrela from '../Icons/3dicons-star-front-premium.png';
import alvo from '../Icons/Alvo.png';
import fogo1 from '../Icons/Fogo1Dia.png';
import fogo15 from '../Icons/Fogo15Dias.png';
import fogo30 from '../Icons/Fogo30Dias.png';
import chat from '../Icons/balao de chat.png';
import mascoteClaro from '../Icons/site inicio/claro.png';
import mascoteEscuro from '../Icons/site inicio/escuro.png';

export const iconSrc = {
  heroi,
  trofeu,
  livro,
  foguete,
  raio,
  coroa,
  estrela,
  alvo,
  fogo1,
  fogo15,
  fogo30,
  chat,
} as const;

/** Arte do mascote de acordo com o tema ativo (versões "claro" e "escuro"). */
export function mascotSrc(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? mascoteEscuro : mascoteClaro;
}

export type IconName = keyof typeof iconSrc;

/** Componente que renderiza um ícone 3D com sombra suave e sem seleção de texto. */
export function Icon({
  name,
  size = 40,
  className = '',
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={iconSrc[name]}
      alt=""
      aria-hidden
      draggable={false}
      width={size}
      height={size}
      style={{ width: size, height: size, ...style }}
      className={`inline-block object-contain select-none icon3d ${className}`}
    />
  );
}

/** Escolhe a chama de acordo com o tamanho da sequência do usuário. */
export function flameFor(streak: number): IconName {
  if (streak >= 30) return 'fogo30';
  if (streak >= 15) return 'fogo15';
  return 'fogo1';
}

// Conquistas são salvas no banco com um emoji; aqui traduzimos para ícones 3D.
const EMOJI_TO_ICON: Record<string, IconName> = {
  '🏆': 'trofeu',
  '🔥': 'fogo15',
  '📚': 'livro',
  '⚡': 'raio',
  '✨': 'estrela',
  '🚀': 'foguete',
  '👑': 'coroa',
  '🎯': 'alvo',
};

/** Renderiza um ícone 3D a partir de um emoji (usado nas conquistas). */
export function EmojiIcon({ emoji, size = 40, className = '' }: { emoji: string; size?: number; className?: string }) {
  const name = EMOJI_TO_ICON[emoji];
  if (!name) return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{emoji}</span>;
  return <Icon name={name} size={size} className={className} />;
}
