import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface SettingsValue {
  theme: Theme;
  sound: boolean;
  reminder: boolean;
  unlimitedPdf: boolean;
  toggleTheme: () => void;
  toggleSound: () => void;
  /** Liga/desliga o lembrete diário. Retorna o novo estado. */
  toggleReminder: () => Promise<boolean>;
  setUnlimitedPdf: (on: boolean) => void;
}

const SettingsCtx = createContext<SettingsValue>(null!);
export const useSettings = () => useContext(SettingsCtx);

const THEME_KEY = 'omni-theme';
const SOUND_KEY = 'omni-sound';
const REMINDER_KEY = 'omni-reminder';
const UNLIMITED_PDF_KEY = 'omni-unlimited-pdf';

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

function initialUnlimitedPdf(): boolean {
  return localStorage.getItem(UNLIMITED_PDF_KEY) === 'on';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [sound, setSoundState] = useState<boolean>(initialSound);
  const [reminder, setReminderState] = useState<boolean>(initialReminder);
  const [unlimitedPdf, setUnlimitedPdfState] = useState<boolean>(initialUnlimitedPdf);

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

  useEffect(() => {
    localStorage.setItem(UNLIMITED_PDF_KEY, unlimitedPdf ? 'on' : 'off');
  }, [unlimitedPdf]);

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
    unlimitedPdf,
    toggleTheme: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    toggleSound: () => setSoundState((s) => !s),
    toggleReminder,
    setUnlimitedPdf: (on: boolean) => setUnlimitedPdfState(on),
  };

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}
