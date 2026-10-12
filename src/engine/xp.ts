export const XP_PER_LEVEL = 1000;

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpInLevel(xp: number): number {
  return ((xp % XP_PER_LEVEL) + XP_PER_LEVEL) % XP_PER_LEVEL;
}
