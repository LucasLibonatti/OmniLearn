import { lastNDates, weekLabel } from '../lib/dates';

export function WeekStrip({ dates }: { dates: string[] }) {
  const set = new Set(dates);
  return (
    <div className="flex gap-2">
      {lastNDates(7).map((d) => {
        const on = set.has(d);
        return (
          <div key={d} className="flex-1 text-center">
            <div className="text-[10px] font-bold text-slate-400">{weekLabel(d)}</div>
            <div
              className={`mt-1 grid place-items-center h-8 rounded-xl font-bold ${on ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-300'}`}
            >
              {on ? '✓' : '·'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
