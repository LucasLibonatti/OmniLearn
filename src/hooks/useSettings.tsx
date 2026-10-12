import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface SettingsValue {
  theme: Theme;
  sound: boolean;
  reminder: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  toggleSound: () => void;
  /** Liga/desliga o lembrete diário. Retorna o novo estado. */
  toggleReminder: () => Promise<boolean>;
}

const SettingsCtx = createContext<SettingsValue>(null!);
export const useSettings = () => useContext(SettingsCtx);

const THEME_KEY = 'omni-theme';
const SOUND_KEY = 'omni-sound';
const REMINDER_KEY = 'omni-reminder';

function initialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initialSound(): boolean {
  return localStorage.getItem(SOUND_KEY) !== 'off';
}

function initialReminder(): boolean {
  return localStorage.getItem(REMINDER_KEY) === 'on';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [sound, setSoundState] = useState<boolean>(initialSound);
  const [reminder, setReminderState] = useState<boolean>(initialReminder);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, sound ? 'on' : 'off');
  }, [sound]);

  useEffect(() => {
    localStorage.setItem(REMINDER_KEY, reminder ? 'on' : 'off');
  }, [reminder]);

  const toggleReminder = async (): Promise<boolean> => {
    if (reminder) {
      setReminderState(false);
      return false;
    }
    if (typeof Notification === 'undefined') return false;
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm !== 'granted') return false;
    setReminderState(true);
    return true;
  };

  const value: SettingsValue = {
    theme,
    sound,
    reminder,
    toggleTheme: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    setTheme: setThemeState,
    toggleSound: () => setSoundState((s) => !s),
    toggleReminder,
  };

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}
