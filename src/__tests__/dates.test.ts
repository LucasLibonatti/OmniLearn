import { describe, expect, it } from 'vitest';
import { addDays, formatDate, lastNDates, streakFromDates, todaySP } from '../lib/dates';
import { levelFromXp, xpInLevel, XP_PER_LEVEL } from '../engine/xp';

describe('dates helpers', () => {
  it('adiciona e subtrai dias corretamente inclusive virada de mês/ano', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('gera os últimos N dias em ordem cronológica terminando hoje', () => {
    const days = lastNDates(7);
    expect(days).toHaveLength(7);
    expect(days[6]).toBe(todaySP());
    expect(days[0]).toBe(addDays(todaySP(), -6));
  });

  it('calcula streak consecutivo terminando hoje ou ontem', () => {
    const today = todaySP();
    const d1 = addDays(today, -1);
    const d2 = addDays(today, -2);
    const d4 = addDays(today, -4);

    expect(streakFromDates([today, d1, d2, d4])).toBe(3);
    expect(streakFromDates([d1, d2])).toBe(2);
    expect(streakFromDates([d4])).toBe(0);
    expect(streakFromDates([])).toBe(0);
  });

  it('formata datas ISO no padrão brasileiro dd/mm/yyyy', () => {
    expect(formatDate('2026-07-15T15:00:00Z')).toBe('15/07/2026');
  });
});

describe('xp & level engine', () => {
  it('calcula nível e progresso dentro do nível corretamente', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(XP_PER_LEVEL - 1)).toBe(1);
    expect(levelFromXp(XP_PER_LEVEL)).toBe(2);
    expect(levelFromXp(2550)).toBe(3);

    expect(xpInLevel(0)).toBe(0);
    expect(xpInLevel(2550)).toBe(550);
    expect(xpInLevel(XP_PER_LEVEL)).toBe(0);
  });
});
